import { Client } from "../../../dist";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const runId = `full-app-run-${Date.now()}`;
  console.log(`Using Run ID: ${runId}`);
  const client = new Client({ runId });
  try {
    console.log("Connecting to All...");
    await client.connect();

    console.log("Checking State...");
    const focusId = await client.state.focus("Full App Test");
    console.log("Focus ID:", focusId);

    console.log("Checking Storage...");
    const health = await client.storage.health();
    console.log("Storage Health:", health);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main();
