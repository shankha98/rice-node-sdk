import { Client } from "../../../dist";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const runId = `storage-app-run-${Date.now()}`;
  console.log(`Using Run ID: ${runId}`);
  const client = new Client({ runId });
  try {
    console.log("Connecting to Storage...");
    await client.connect();
    console.log("Connected!");

    // Check health
    const health = await client.storage.health();
    console.log("Health:", health);

    // Insert
    console.log("Inserting document...");
    const nodeId = Date.now(); // Must be Long/number for RiceDB
    const insertResult = await client.storage.insert(
      nodeId,
      "Hello from Storage App",
      { type: "example" },
    );
    console.log("Insert Result:", insertResult);

    // Search
    console.log("Searching...");
    // search(query, userId, k, sessionId?, filter?, queryEmbedding?)
    const searchResults = await client.storage.search("Hello", 1);
    console.log("Search Results:", searchResults);

    // Attempt state access (should fail)
    try {
      console.log("Checking if State is disabled...");
      client.state;
    } catch (e: any) {
      console.log("Success: State access prevented:", e.message);
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main();
