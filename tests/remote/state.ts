import { Client } from "../../src/Client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, ".env") });

async function main() {
  console.log("Testing Remote State Connection...");
  console.log("URL:", process.env.STATE_INSTANCE_URL);

  const client = new Client({
    configPath: path.join(__dirname, "rice.state.config.js"),
  });

  try {
    await client.connect();
    console.log("Connected!");

    console.log("Focusing...");
    await client.state.focus("Remote test focus");
    console.log("Focus successful.");

    console.log("Committing...");
    await client.state.commit("Remote input", "Remote output", {
      reasoning: "test",
    });
    console.log("Commit successful.");

    console.log("Reminiscing...");
    const memories = await client.state.reminisce("Remote input");
    console.log("Memories:", memories);
  } catch (error) {
    console.error("State Test Failed:", error);
  }
}

main();
