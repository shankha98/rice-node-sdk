import { Client } from "../../../dist";

async function main() {
  const client = new Client();
  try {
    console.log("Connecting to Storage...");
    await client.connect();
    console.log("Connected!");

    // Check health
    const health = await client.storage.health();
    console.log("Health:", health);

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
