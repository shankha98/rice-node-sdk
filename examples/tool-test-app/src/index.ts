import { Client } from "../../../dist";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from tests/remote to ensure identical config
dotenv.config({ path: path.resolve(__dirname, "../../../tests/remote/.env") });
import { execute } from "../../../dist/tools/execute";
import * as crypto from "crypto";

async function main() {
  const timestamp = Date.now();
  const runId = `tool-test-run-${timestamp}`;
  console.log(`Run ID: ${runId}`);

  const client = new Client({
    runId,
    configPath: path.resolve(__dirname, "../rice.config.js"),
  });
  await client.connect();

  const content = `Tool Test Content ${runId}`;

  // 1. Focus -> Should affect Drift
  console.log("[1] Executing focus...");
  const resultFocus = await execute("focus", { content }, client.state);
  console.log("Focus result:", resultFocus);

  // Check Drift to verify Remember
  const driftItems = await client.state.drift();
  console.log(
    "Drift items:",
    driftItems.map((i: any) => i.content),
  );

  // 2. Remember (Commit) -> Should affect Reminisce
  console.log("[2] Executing remember...");
  const remResult = await execute(
    "remember",
    {
      input: `User input: ${content}`,
      outcome: "System outcome",
      action: "test",
    },
    client.state,
  );
  console.log("Remember result:", remResult);

  // Wait for indexing
  console.log("Waiting 3s for indexing...");
  await new Promise((r) => setTimeout(r, 3000));

  // 3. Recall (Reminisce) -> Should find the saved experience
  console.log("[3] Executing recall...");
  const memories = await execute(
    "recall",
    { query: "Tool Test" },
    client.state,
  );
  console.log(
    `Recall found ${Array.isArray(memories) ? memories.length : 0} items.`,
  );
  if (Array.isArray(memories)) {
    memories.forEach((m: any) => console.log(` - ${m.input} -> ${m.outcome}`));
  }
}
main().catch(console.error);
