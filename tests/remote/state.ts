import { Client } from "../../src/Client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, ".env") });

async function main() {
  console.log("Testing Remote State Connection...");
  console.log("URL:", process.env.STATE_INSTANCE_URL);

  const timestamp = Date.now();
  const runId = `test-run-${timestamp}`;
  const input = `Remote input ${timestamp}`;
  const output = `Remote output ${timestamp}`;

  console.log(`Using Run ID: ${runId}`);
  console.log(`Using Input: ${input}`);

  const client = new Client({
    configPath: path.join(__dirname, "rice.state.config.js"),
    runId: runId,
  });

  try {
    await client.connect();
    console.log("Connected!");

    console.log("Focusing...");
    await client.state.focus(`Remote test focus ${timestamp}`);
    console.log("Focus successful.");

    console.log("Committing...");
    await client.state.commit(input, output, {
      reasoning: "test",
    });
    console.log("Commit successful.");

    console.log("Waiting 3s for indexing...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Reminiscing...");
    const memories = await client.state.reminisce(input);
    console.log(`Found ${memories.length} memories.`);
    console.log("Memories:", memories);

    if (memories.length > 0 && memories[0].input === input) {
      console.log("VERIFICATION PASSED: Retrieved newly inserted memory.");
    } else {
      console.log(
        "VERIFICATION FAILED: Could not retrieve newly inserted memory.",
      );
    }

    console.log("Cleaning up run...");
    const deleted = await client.state.deleteRun();
    console.log("Run cleanup success:", deleted);
  } catch (error) {
    console.error("State Test Failed:", error);
  }
}

main();
