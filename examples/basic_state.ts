import { Client } from "../src/Client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from tests/remote to ensure identical config
dotenv.config({ path: path.resolve(__dirname, "../tests/remote/.env") });

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
    configPath: path.resolve(__dirname, "../tests/remote/rice.state.config.js"),
    runId: runId,
  });

  try {
    await client.connect();
    console.log("Connected!");

    // =========================================================================
    // Core Memory Operations
    // =========================================================================
    console.log("\n=== Core Memory Operations ===");

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

    // =========================================================================
    // Working Memory (Structured Variables)
    // =========================================================================
    console.log("\n=== Working Memory (Structured Variables) ===");

    // Set variables
    console.log("Setting variables...");
    await client.state.setVariable("user_name", "Alice", "explicit");
    await client.state.setVariable(
      "session_context",
      {
        task: "code review",
        language: "TypeScript",
        priority: "high",
      },
      "system",
    );
    await client.state.setVariable("counter", 42, "reasoning");
    console.log("Variables set.");

    // Get a variable
    console.log("Getting variable 'user_name'...");
    const userName = await client.state.getVariable("user_name");
    console.log("Variable:", userName);

    // List all variables
    console.log("Listing all variables...");
    const variables = await client.state.listVariables();
    console.log("Variables:", variables);

    // Delete a variable
    console.log("Deleting variable 'counter'...");
    await client.state.deleteVariable("counter");
    console.log("Variable deleted.");

    // =========================================================================
    // Goals
    // =========================================================================
    console.log("\n=== Goals ===");

    // Add goals
    console.log("Adding goals...");
    const mainGoal = await client.state.addGoal("Complete code review", "high");
    console.log("Main goal:", mainGoal);

    const subGoal1 = await client.state.addGoal(
      "Review authentication module",
      "medium",
      mainGoal.id,
    );
    console.log("Sub-goal 1:", subGoal1);

    const subGoal2 = await client.state.addGoal(
      "Review API endpoints",
      "medium",
      mainGoal.id,
    );
    console.log("Sub-goal 2:", subGoal2);

    // List goals
    console.log("Listing all goals...");
    const allGoals = await client.state.listGoals();
    console.log("All goals:", allGoals);

    // Update goal status
    console.log("Marking sub-goal 1 as achieved...");
    await client.state.updateGoal(subGoal1.id, "achieved");
    console.log("Goal updated.");

    // List active goals
    console.log("Listing active goals...");
    const activeGoals = await client.state.listGoals("active");
    console.log("Active goals:", activeGoals);

    // =========================================================================
    // Actions
    // =========================================================================
    console.log("\n=== Actions ===");

    // Submit actions
    console.log("Submitting actions...");
    const action1 = await client.state.submitAction("agent-1", "reason", {
      thought: "Need to analyze the code structure first",
      conclusion: "Start with the main entry point",
    });
    console.log("Action 1 result:", action1);

    const action2 = await client.state.submitAction("agent-1", "retrieve", {
      query: "authentication best practices",
      sources: ["docs", "knowledge_base"],
    });
    console.log("Action 2 result:", action2);

    // Get action log
    console.log("Getting action log...");
    const actionLog = await client.state.getActionLog(10);
    console.log("Action log:", actionLog);

    // Filter by action type
    console.log("Getting 'reason' actions only...");
    const reasonActions = await client.state.getActionLog(10, "reason");
    console.log("Reason actions:", reasonActions);

    console.log("\nCleaning up run...");
    const deleted = await client.state.deleteRun();
    console.log("Run cleanup success:", deleted);

    console.log("\n=== All Tests Completed ===");
  } catch (error) {
    console.error("State Test Failed:", error);
  }
}

main();
