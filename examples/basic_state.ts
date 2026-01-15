import { state } from "../dist";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from project root or examples folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function main() {
  // Config from environment
  const address = process.env.STATE_INSTANCE_URL || "localhost:50051";
  const token = process.env.STATE_AUTH_TOKEN || "dev_secret";
  // Generate a UUID for the run ID to satisfy backend requirements
  const runId = require("crypto").randomUUID();

  console.log(`Connecting to State Service at ${address}`);
  console.log(`Run ID: ${runId}`);

  const client = new state(address, token, runId);

  // 1. Focus
  try {
    console.log("\n[1] Focusing on task...");
    const focusId = await client.focus("Testing SDK integration for State");
    console.log(`Success. Focus ID: ${focusId}`);
  } catch (e) {
    console.error("Focus failed (is the server running?):", e);
    // If we can't connect, no point continuing
    process.exit(1);
  }

  // 2. Commit a trace
  try {
    console.log("\n[2] Committing interaction trace...");
    const success = await client.commit(
      "What is the status?",
      "All systems operational.",
      { action: "check_status", agent_id: "test-agent" }
    );
    console.log(`Commit success: ${success}`);
  } catch (e) {
    console.error("Commit failed:", e);
  }

  // 3. Reminisce (Search)
  try {
    console.log("\n[3] Reminiscing (Searching)...");
    // Give it a moment for potential async indexing
    await new Promise((r) => setTimeout(r, 1000));

    const memories = await client.reminisce("status");
    console.log(`Found ${memories.length} relevant memories.`);
    memories.forEach((m) => {
      console.log(` - [${m.agent_id}] ${m.input} -> ${m.outcome}`);
    });
  } catch (e) {
    console.error("Reminisce failed:", e);
  }

  // 4. Cleanup
  try {
    console.log("\n[4] Cleaning up run...");
    await client.deleteRun();
    console.log("Run deleted successfully.");
  } catch (e) {
    console.error("Cleanup failed:", e);
  }
}

main().catch(console.error);
