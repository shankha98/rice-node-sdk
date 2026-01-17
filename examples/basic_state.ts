import { Client } from "../dist";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function main() {
  // Use a fixed Run ID so memories persist across executions.
  // This ensures that subsequent runs can find memories committed in previous runs.
  const runId = "basic-state-example";
  console.log(`Run ID: ${runId}`);

  const client = new Client({ runId });
  await client.connect();

  // 1. Focus
  try {
    console.log("\n[1] Focusing on task...");
    const focusId = await client.state.focus(
      "Testing SDK integration for State",
    );
    console.log(`Success. Focus ID: ${focusId}`);
  } catch (e) {
    console.error("Focus failed (is the server running?):", e);
    // If we can't connect, no point continuing
    process.exit(1);
  }

  // 2. Commit a trace
  try {
    console.log("\n[2] Committing interaction trace...");
    const success = await client.state.commit(
      "What is the status?",
      "All systems operational.",
      { action: "check_status", agent_id: "test-agent" },
    );
    console.log(`Commit success: ${success}`);
  } catch (e) {
    console.error("Commit failed:", e);
  }

  // 3. Reminisce (Search)
  try {
    console.log("\n[3] Reminiscing (Searching)...");

    // No wait needed if we expect to find memories from previous runs.
    // Newly committed memories might still take a moment to appear.
    const memories = await client.state.reminisce("status");
    console.log(`Found ${memories.length} relevant memories.`);
    console.log("Memories:", memories);
  } catch (e) {
    console.error("Reminisce failed:", e);
  }
}

main().catch(console.error);
