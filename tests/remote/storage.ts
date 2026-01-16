import { Client } from "../../src/Client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, ".env") });

async function main() {
  console.log("Testing Remote Storage Connection...");
  console.log("URL:", process.env.STORAGE_INSTANCE_URL);

  const client = new Client({
    configPath: path.join(__dirname, "rice.storage.config.js"),
  });
  // Disable state for this test
  // We can't easily disable via env unless we set STATE_INSTANCE_URL to empty?
  // Or we create a config object.
  // Client constructor takes options. But config is loaded from file/env.
  // Let's just ignore state errors if possible, or rely on Client to only connect if configured.
  // Actually Client.connect tries both.

  try {
    await client.connect();
    console.log("Connected!");

    const id = Date.now().toString();
    console.log("Inserting document:", id);
    await client.storage.insert(id, "This is a remote test document.", {
      source: "test-script",
    });
    console.log("Insert successful.");

    console.log("Searching...");
    const results = await client.storage.search("remote test", 5);
    console.log("Search results:", results);

    console.log("Deleting document:", id);
    await client.storage.delete(id);
    console.log("Delete successful.");
  } catch (error) {
    console.error("Storage Test Failed:", error);
  }
}

main();
