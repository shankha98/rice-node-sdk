import { Client } from "../src/Client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../tests/remote/.env") });

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const runA = `state-iso-a-${Date.now().toString(36)}`;
  const runB = `state-iso-b-${(Date.now() + 1).toString(36)}`;

  console.log(`Run A: ${runA}`);
  console.log(`Run B: ${runB}`);

  const configPath = path.resolve(__dirname, "../tests/remote/rice.state.config.js");
  const clientA = new Client({ configPath, runId: runA });
  const clientB = new Client({ configPath, runId: runB });

  try {
    await clientA.connect();
    await clientB.connect();

    const messageA = `state isolation secret ${runA}`;
    const messageB = `state isolation secret ${runB}`;

    await clientA.state.commit(messageA, "ok", {
      action: "isolation-check",
      reasoning: "run-a",
      agent_id: "state-iso-a",
    });
    await clientB.state.commit(messageB, "ok", {
      action: "isolation-check",
      reasoning: "run-b",
      agent_id: "state-iso-b",
    });

    console.log("Committed traces. Waiting for indexing (4s)...");
    await wait(4000);

    const tracesA = await clientA.state.reminisce(messageA, 20);
    const tracesB = await clientB.state.reminisce(messageB, 20);

    const badA = tracesA.filter((t: any) => t.run_id !== runA);
    const badB = tracesB.filter((t: any) => t.run_id !== runB);

    console.log(
      `Run A returned ${tracesA.length} traces; cross-run hits: ${badA.length}`,
    );
    console.log(
      `Run B returned ${tracesB.length} traces; cross-run hits: ${badB.length}`,
    );

    if (badA.length > 0 || badB.length > 0) {
      throw new Error("run isolation leak detected");
    }

    console.log("PASS: run isolation looks correct for reminisce.");

    console.log("Deleting Run A and verifying cleanup...");
    await clientA.state.deleteRun();
    await wait(2000);

    const tracesAAfter = await clientA.state.reminisce(messageA, 20);
    const tracesBAfter = await clientB.state.reminisce(messageB, 20);

    const runAStillPresent = tracesAAfter.some((t: any) => t.run_id === runA);
    const runBMissing = !tracesBAfter.some((t: any) => t.run_id === runB);

    console.log(`Run A traces after delete: ${tracesAAfter.length}`);
    console.log(`Run B traces after delete: ${tracesBAfter.length}`);

    if (runAStillPresent) {
      throw new Error("run A data still present after deleteRun");
    }
    if (runBMissing) {
      throw new Error("run B data missing after deleting run A");
    }

    console.log("PASS: deleteRun behavior looks correct.");
  } finally {
    try {
      await clientB.state.deleteRun();
    } catch {
      // Best-effort cleanup for run B.
    }
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
