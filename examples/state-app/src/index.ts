import { Client } from "../../../dist";

async function main() {
  const client = new Client();
  try {
    console.log("Connecting to State...");
    await client.connect();

    // Check State
    const focusId = await client.state.focus("State App Test");
    console.log("Focus ID:", focusId);

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
