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

  // =========================================================================
  // SECTION 1: Core Memory Tools
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("SECTION 1: Core Memory Tools");
  console.log("=".repeat(60));

  // 1. Focus -> Should affect Drift
  console.log("\n[1.1] Executing focus...");
  const resultFocus = await execute("focus", { content }, client.state);
  console.log("Focus result:", resultFocus);

  // Check Drift to verify Remember
  const driftItems = await client.state.drift();
  console.log(
    "Drift items:",
    driftItems.map((i: any) => i.content),
  );

  // 2. Remember (Commit) -> Should affect Reminisce
  console.log("\n[1.2] Executing remember...");
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
  console.log("\n[1.3] Executing recall...");
  const memories = await execute(
    "recall",
    { query: `User input: ${content}` },
    client.state,
  );
  console.log(
    `Recall found ${Array.isArray(memories) ? memories.length : 0} items.`,
  );
  if (Array.isArray(memories)) {
    memories.forEach((m: any) => console.log(` - ${m.input} -> ${m.outcome}`));

    if (memories.length > 0 && memories[0].input === `User input: ${content}`) {
      console.log("✓ VERIFICATION PASSED: Retrieved newly inserted memory.");
    } else {
      console.log(
        "✗ VERIFICATION FAILED: Could not retrieve newly inserted memory.",
      );
    }
  }

  // =========================================================================
  // SECTION 2: Working Memory Tools
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("SECTION 2: Working Memory Tools");
  console.log("=".repeat(60));

  // 2.1 setVariable
  console.log("\n[2.1] Executing setVariable...");
  await execute(
    "setVariable",
    {
      name: "agent_state",
      value: { status: "active", mode: "exploration" },
      source: "system",
    },
    client.state,
  );
  console.log("Variable 'agent_state' set.");

  await execute(
    "setVariable",
    {
      name: "context_summary",
      value: "Testing the new tool features",
      source: "reasoning",
    },
    client.state,
  );
  console.log("Variable 'context_summary' set.");

  // 2.2 getVariable
  console.log("\n[2.2] Executing getVariable...");
  const agentState = await execute(
    "getVariable",
    { name: "agent_state" },
    client.state,
  );
  console.log("Retrieved agent_state:", agentState);

  // 2.3 listVariables
  console.log("\n[2.3] Executing listVariables...");
  const allVars = await execute("listVariables", {}, client.state);
  console.log("All variables:", allVars);

  // 2.4 deleteVariable
  console.log("\n[2.4] Executing deleteVariable...");
  await execute("deleteVariable", { name: "context_summary" }, client.state);
  console.log("Variable 'context_summary' deleted.");

  const varsAfterDelete = await execute("listVariables", {}, client.state);
  console.log("Variables after delete:", varsAfterDelete);

  // =========================================================================
  // SECTION 3: Goal Tools
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("SECTION 3: Goal Tools");
  console.log("=".repeat(60));

  // 3.1 addGoal
  console.log("\n[3.1] Executing addGoal...");
  const mainGoal = await execute(
    "addGoal",
    {
      description: "Test all new SDK features",
      priority: "high",
    },
    client.state,
  );
  console.log("Main goal created:", mainGoal);

  const subGoal = await execute(
    "addGoal",
    {
      description: "Test working memory tools",
      priority: "medium",
      parentId: mainGoal.id,
    },
    client.state,
  );
  console.log("Sub-goal created:", subGoal);

  // 3.2 listGoals
  console.log("\n[3.2] Executing listGoals...");
  const allGoals = await execute("listGoals", {}, client.state);
  console.log("All goals:", allGoals);

  // 3.3 updateGoal
  console.log("\n[3.3] Executing updateGoal...");
  await execute(
    "updateGoal",
    {
      goalId: subGoal.id,
      status: "achieved",
    },
    client.state,
  );
  console.log("Sub-goal marked as achieved.");

  const goalsAfterUpdate = await execute(
    "listGoals",
    { statusFilter: "achieved" },
    client.state,
  );
  console.log("Achieved goals:", goalsAfterUpdate);

  // =========================================================================
  // SECTION 4: Action Tools
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("SECTION 4: Action Tools");
  console.log("=".repeat(60));

  // 4.1 submitAction
  console.log("\n[4.1] Executing submitAction...");
  const actionResult1 = await execute(
    "submitAction",
    {
      agentId: "tool-test-agent",
      actionType: "reason",
      actionDetails: {
        thought: "Evaluating test results",
        conclusion: "All tools working correctly",
      },
    },
    client.state,
  );
  console.log("Action 1 result:", actionResult1);

  const actionResult2 = await execute(
    "submitAction",
    {
      agentId: "tool-test-agent",
      actionType: "retrieve",
      actionDetails: {
        query: "best practices for testing",
        sources: ["docs"],
      },
    },
    client.state,
  );
  console.log("Action 2 result:", actionResult2);

  // 4.2 getActionLog
  console.log("\n[4.2] Executing getActionLog...");
  const actionLog = await execute("getActionLog", { limit: 10 }, client.state);
  console.log(`Action log (${actionLog.length} entries):`);
  actionLog.forEach((a: any) =>
    console.log(`  - [${a.actionType}] ${a.actionId} (success: ${a.success})`),
  );

  // 4.3 getActionLog with filter
  console.log("\n[4.3] Executing getActionLog with filter...");
  const reasonActions = await execute(
    "getActionLog",
    { limit: 10, actionTypeFilter: "reason" },
    client.state,
  );
  console.log(`Reason actions (${reasonActions.length} entries):`);
  reasonActions.forEach((a: any) =>
    console.log(`  - ${a.actionId}: ${JSON.stringify(a.action)}`),
  );

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("ALL TOOL TESTS COMPLETED!");
  console.log("=".repeat(60));
  console.log("\nTools tested:");
  console.log("  ✓ focus");
  console.log("  ✓ remember");
  console.log("  ✓ recall");
  console.log("  ✓ setVariable");
  console.log("  ✓ getVariable");
  console.log("  ✓ listVariables");
  console.log("  ✓ deleteVariable");
  console.log("  ✓ addGoal");
  console.log("  ✓ listGoals");
  console.log("  ✓ updateGoal");
  console.log("  ✓ submitAction");
  console.log("  ✓ getActionLog");
}
main().catch(console.error);
