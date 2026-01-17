import { Client } from "../../../dist";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from tests/remote to ensure identical config
dotenv.config({ path: path.resolve(__dirname, "../../../tests/remote/.env") });

async function main() {
  const timestamp = Date.now();
  const runId = `state-app-run-${timestamp}`;
  const input = `StateApp unique input ${timestamp}`;
  const output = `StateApp unique output ${timestamp}`;

  console.log(`Run ID: ${runId}`);

  const client = new Client({
    runId,
    configPath: path.resolve(__dirname, "../rice.config.js"),
  });

  try {
    console.log("Connecting to State...");
    await client.connect();

    // 1. Focus (Short-term / Working Memory)
    console.log("[1] Focusing...");
    const focusId = await client.state.focus(`Focus ${timestamp}`);
    console.log("Focus ID:", focusId);

    // 2. Drift (Read Working Memory)
    console.log("[2] Drifting...");
    const driftItems = await client.state.drift();
    console.log(`Drift items: ${driftItems.length}`);
    driftItems.forEach((item: any) => console.log(` - ${item.content}`));

    // 3. Commit (Long-term / Episodic Memory)
    console.log("[3] Committing...");
    const success = await client.state.commit(input, output, {
      action: "test_action",
      agent_id: "state-app-agent",
    });
    console.log("Commit success:", success);

    // 4. Reminisce (Recall Episodic Memory)
    console.log("[4] Reminiscing...");
    // Wait for indexing
    console.log("Waiting 6s for indexing...");
    await new Promise((r) => setTimeout(r, 6000));

    const memories = await client.state.reminisce(input);
    console.log(`Memories found: ${memories.length}`);
    memories.forEach((m: any) => console.log(` - ${m.input} -> ${m.outcome}`));

    if (memories.length > 0 && memories[0].input === input) {
      console.log("VERIFICATION PASSED: Retrieved newly inserted memory.");
    } else {
      console.log(
        "VERIFICATION FAILED: Could not retrieve newly inserted memory.",
      );
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main();
