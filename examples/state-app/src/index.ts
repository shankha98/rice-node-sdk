import { Client } from "../../../dist";

async function main() {
  const client = new Client();
  try {
    console.log("Connecting to State...");
    await client.connect();

    // 1. Focus (Short-term / Working Memory)
    console.log("[1] Focusing...");
    const focusId = await client.state.focus("State App Test Context");
    console.log("Focus ID:", focusId);

    // 2. Drift (Read Working Memory)
    console.log("[2] Drifting...");
    const driftItems = await client.state.drift();
    console.log(`Drift items: ${driftItems.length}`);
    driftItems.forEach((item: any) => console.log(` - ${item.content}`));

    // 3. Commit (Long-term / Episodic Memory)
    console.log("[3] Committing...");
    const success = await client.state.commit(
      "What is the test?",
      "Testing all memory types.",
      { action: "test_action", agent_id: "state-app-agent" }
    );
    console.log("Commit success:", success);

    // 4. Reminisce (Recall Episodic Memory)
    console.log("[4] Reminiscing...");
    // Wait briefly for indexing
    await new Promise((r) => setTimeout(r, 1000));
    const memories = await client.state.reminisce("test");
    console.log(`Memories found: ${memories.length}`);
    memories.forEach((m: any) => console.log(` - ${m.input} -> ${m.outcome}`));

    // 5. Cleanup
    console.log("[5] Deleting Run...");
    try {
      const delSuccess = await client.state.deleteRun();
      console.log("Delete Run success:", delSuccess);
    } catch (e: any) {
      console.warn("Delete Run failed (known server issue):", e.message);
    }

    // 6. Test Switching Run ID
    console.log('[6] Switching Run ID to "new-run-id"...');
    client.state.setRunId("new-run-id");

    console.log("[6.1] Focusing with new Run ID...");
    const focusId2 = await client.state.focus("New Context");
    console.log("New Focus ID:", focusId2);

    console.log("[6.2] Drifting with new Run ID...");
    const driftItems2 = await client.state.drift();
    console.log(`Drift items (should be 1): ${driftItems2.length}`);
    driftItems2.forEach((item: any) => console.log(` - ${item.content}`));

    // Check Storage (should fail)
    try {
      console.log("Checking if Storage is disabled...");
      client.storage;
    } catch (e: any) {
      console.log("Success: Storage access prevented:", e.message);
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main();
