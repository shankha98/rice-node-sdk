import { Client } from "../src/Client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../tests/remote/.env") });

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collectSnapshot(
  client: Client,
  runId: string,
  waitForTrace: boolean = false,
) {
  let traces = await client.state.reminisce(`all-memory marker ${runId}`, 20);

  if (waitForTrace) {
    const deadline = Date.now() + 12000;
    while (
      Date.now() < deadline &&
      !traces.some((t: any) => t.run_id === runId)
    ) {
      await wait(1000);
      traces = await client.state.reminisce(`all-memory marker ${runId}`, 20);
    }
  }

  return {
    flux: await client.state.drift(),
    traces,
    variables: await client.state.listVariables(),
    goals: await client.state.listGoals(),
    concepts: await client.state.listConcepts(),
  };
}

async function main() {
  const runA = `state-allmem-a-${Date.now().toString(36)}`;
  const runB = `state-allmem-b-${(Date.now() + 1).toString(36)}`;

  console.log(`Run A: ${runA}`);
  console.log(`Run B: ${runB}`);

  const configPath = path.resolve(__dirname, "../tests/remote/rice.state.config.js");
  const clientA = new Client({ configPath, runId: runA });
  const clientB = new Client({ configPath, runId: runB });

  try {
    await clientA.connect();
    await clientB.connect();

    await clientA.state.focus(`flux-marker-${runA}`);
    await clientB.state.focus(`flux-marker-${runB}`);

    await clientA.state.commit(`all-memory marker ${runA}`, "ok", {
      action: "all-memory-check",
      reasoning: "run-a",
      agent_id: "state-allmem-a",
    });
    await clientB.state.commit(`all-memory marker ${runB}`, "ok", {
      action: "all-memory-check",
      reasoning: "run-b",
      agent_id: "state-allmem-b",
    });

    await clientA.state.setVariable("owner", { run: runA });
    await clientB.state.setVariable("owner", { run: runB });

    await clientA.state.addGoal(`goal-${runA}`, "high");
    await clientB.state.addGoal(`goal-${runB}`, "high");

    await clientA.state.defineConcept("profile", { type: "object", run: runA });
    await clientB.state.defineConcept("profile", { type: "object", run: runB });

    console.log("Committed data across memory types. Waiting for indexing (4s)...");
    await wait(4000);

    const failures: string[] = [];

    const beforeA = await collectSnapshot(clientA, runA, true);
    const beforeB = await collectSnapshot(clientB, runB, true);

    if (beforeA.flux.length === 0 || beforeB.flux.length === 0) {
      failures.push("Flux data missing before delete.");
    }

    if (beforeA.traces.some((t: any) => t.run_id !== runA)) {
      failures.push("Echoes run A reminisce returned cross-run trace.");
    }
    if (beforeB.traces.some((t: any) => t.run_id !== runB)) {
      failures.push("Echoes run B reminisce returned cross-run trace.");
    }
    if (beforeA.traces.length === 0 || beforeB.traces.length === 0) {
      failures.push("Echoes data missing before delete.");
    }

    if (beforeA.variables.length === 0 || beforeB.variables.length === 0) {
      failures.push("Variable data missing before delete.");
    }
    if (beforeA.goals.length === 0 || beforeB.goals.length === 0) {
      failures.push("Goal data missing before delete.");
    }
    if (beforeA.concepts.length === 0 || beforeB.concepts.length === 0) {
      failures.push("Concept data missing before delete.");
    }

    console.log("Deleting Run A and validating run-scoped cleanup...");
    await clientA.state.deleteRun();
    await wait(2000);

    const afterA = await collectSnapshot(clientA, runA);
    const afterB = await collectSnapshot(clientB, runB);

    if (afterA.flux.length > 0) {
      failures.push("Flux for run A still present after deleteRun.");
    }
    if (afterA.traces.some((t: any) => t.run_id === runA)) {
      failures.push("Echoes for run A still present after deleteRun.");
    }
    if (afterA.variables.length > 0) {
      failures.push("Variables for run A still present after deleteRun.");
    }
    if (afterA.goals.length > 0) {
      failures.push("Goals for run A still present after deleteRun.");
    }
    if (afterA.concepts.length > 0) {
      failures.push("Concepts for run A still present after deleteRun.");
    }

    if (afterB.flux.length === 0) {
      failures.push("Flux for run B disappeared after deleting run A.");
    }
    if (!afterB.traces.some((t: any) => t.run_id === runB)) {
      failures.push("Echoes for run B missing after deleting run A.");
    }
    if (afterB.variables.length === 0) {
      failures.push("Variables for run B missing after deleting run A.");
    }
    if (afterB.goals.length === 0) {
      failures.push("Goals for run B missing after deleting run A.");
    }
    if (afterB.concepts.length === 0) {
      failures.push("Concepts for run B missing after deleting run A.");
    }

    if (failures.length > 0) {
      throw new Error(`Isolation check failures:\n- ${failures.join("\n- ")}`);
    }

    console.log(
      "PASS: isolation and deleteRun behavior look correct across tested memory types.",
    );
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
