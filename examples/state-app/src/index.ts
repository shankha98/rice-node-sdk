import { Client } from "../../../dist";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from tests/remote to ensure identical config
dotenv.config({ path: path.resolve(__dirname, "../../../tests/remote/.env") });

async function main() {
  const timestamp = Date.now();
  const runId = `state-app-run-${timestamp}`;
  const input = `StateApp unique input ${timestamp}`;
  const output = `StateApp unique output ${timestamp}`;

  console.log(`Run ID: ${runId}`);

  const client = new Client({
    runId,
    configPath: path.resolve(__dirname, "../rice.config.js"),
  });

  try {
    console.log("Connecting to State...");
    await client.connect();

    // =========================================================================
    // SECTION 1: Core Memory Operations
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 1: Core Memory Operations");
    console.log("=".repeat(60));

    // 1. Focus (Short-term / Working Memory)
    console.log("\n[1.1] Focusing...");
    const focusId = await client.state.focus(`Focus ${timestamp}`);
    console.log("Focus ID:", focusId);

    // 2. Drift (Read Working Memory)
    console.log("\n[1.2] Drifting...");
    const driftItems = await client.state.drift();
    console.log(`Drift items: ${driftItems.length}`);
    driftItems.forEach((item: any) => console.log(` - ${item.content}`));

    // 3. Commit (Long-term / Episodic Memory)
    console.log("\n[1.3] Committing...");
    const success = await client.state.commit(input, output, {
      action: "test_action",
      agent_id: "state-app-agent",
    });
    console.log("Commit success:", success);

    // 4. Reminisce (Recall Episodic Memory)
    console.log("\n[1.4] Reminiscing...");
    console.log("Waiting 6s for indexing...");
    await new Promise((r) => setTimeout(r, 6000));

    const memories = await client.state.reminisce(input);
    console.log(`Memories found: ${memories.length}`);
    memories.forEach((m: any) => console.log(` - ${m.input} -> ${m.outcome}`));

    if (memories.length > 0 && memories[0].input === input) {
      console.log("✓ VERIFICATION PASSED: Retrieved newly inserted memory.");
    } else {
      console.log(
        "✗ VERIFICATION FAILED: Could not retrieve newly inserted memory.",
      );
    }

    // =========================================================================
    // SECTION 2: Working Memory (Structured Variables)
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 2: Working Memory (Structured Variables)");
    console.log("=".repeat(60));

    // 2.1 Set Variables
    console.log("\n[2.1] Setting variables...");
    await client.state.setVariable("current_task", "data_analysis", "system");
    await client.state.setVariable(
      "user_preferences",
      {
        theme: "dark",
        language: "en",
        notifications: true,
      },
      "explicit",
    );
    await client.state.setVariable("iteration_count", 0, "reasoning");
    console.log("Variables set successfully.");

    // 2.2 Get Variable
    console.log("\n[2.2] Getting variable...");
    const taskVar = await client.state.getVariable("current_task");
    console.log("current_task:", taskVar);

    const prefsVar = await client.state.getVariable("user_preferences");
    console.log("user_preferences:", prefsVar);

    // 2.3 List Variables
    console.log("\n[2.3] Listing all variables...");
    const allVars = await client.state.listVariables();
    console.log("All variables:");
    allVars.forEach((v: any) =>
      console.log(
        `  - ${v.name}: ${JSON.stringify(v.value)} (source: ${v.source})`,
      ),
    );

    // 2.4 Delete Variable
    console.log("\n[2.4] Deleting variable 'iteration_count'...");
    await client.state.deleteVariable("iteration_count");
    const varsAfterDelete = await client.state.listVariables();
    console.log(`Variables after delete: ${varsAfterDelete.length}`);

    // =========================================================================
    // SECTION 3: Concepts (Level 4 Agency)
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 3: Concepts (Level 4 Agency)");
    console.log("=".repeat(60));

    // 3.1 Define Concepts
    console.log("\n[3.1] Defining concepts...");
    await client.state.defineConcept("Task", {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed"],
        },
        priority: { type: "number", minimum: 1, maximum: 5 },
      },
      required: ["id", "title", "status"],
    });

    await client.state.defineConcept("User", {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
        role: { type: "string", enum: ["admin", "user", "guest"] },
      },
      required: ["id", "name"],
    });
    console.log("Concepts defined.");

    // 3.2 List Concepts
    console.log("\n[3.2] Listing concepts...");
    const concepts = await client.state.listConcepts();
    console.log("Defined concepts:");
    concepts.forEach((c: any) =>
      console.log(`  - ${c.name}: ${JSON.stringify(c.schema)}`),
    );

    // =========================================================================
    // SECTION 4: Goals
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 4: Goals");
    console.log("=".repeat(60));

    // 4.1 Add Goals (with hierarchy)
    console.log("\n[4.1] Adding goals...");
    const projectGoal = await client.state.addGoal(
      "Complete project deliverables",
      "critical",
    );
    console.log("Project goal:", projectGoal);

    const milestone1 = await client.state.addGoal(
      "Finish backend API",
      "high",
      projectGoal.id,
    );
    console.log("Milestone 1:", milestone1);

    const milestone2 = await client.state.addGoal(
      "Complete frontend UI",
      "high",
      projectGoal.id,
    );
    console.log("Milestone 2:", milestone2);

    const task1 = await client.state.addGoal(
      "Implement authentication endpoint",
      "medium",
      milestone1.id,
    );
    console.log("Task 1:", task1);

    // 4.2 List Goals
    console.log("\n[4.2] Listing all goals...");
    const allGoals = await client.state.listGoals();
    console.log("All goals:");
    allGoals.forEach((g: any) =>
      console.log(
        `  - [${g.priority}] ${g.description} (status: ${g.status}, parent: ${g.parent_id || "none"})`,
      ),
    );

    // 4.3 Update Goal Status
    console.log("\n[4.3] Updating goal status...");
    await client.state.updateGoal(task1.id, "achieved");
    console.log(`Task '${task1.description}' marked as achieved.`);

    // 4.4 List Goals by Status
    console.log("\n[4.4] Listing achieved goals...");
    const achievedGoals = await client.state.listGoals("achieved");
    console.log("Achieved goals:");
    achievedGoals.forEach((g: any) => console.log(`  - ${g.description}`));

    // =========================================================================
    // SECTION 5: Actions
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 5: Actions");
    console.log("=".repeat(60));

    // 5.1 Submit Actions
    console.log("\n[5.1] Submitting actions...");

    const reasonAction = await client.state.submitAction(
      "state-app-agent",
      "reason",
      {
        thought: "Analyzing the project requirements",
        context: "Initial planning phase",
        conclusion: "Need to prioritize backend tasks",
      },
    );
    console.log("Reason action:", reasonAction);

    const retrieveAction = await client.state.submitAction(
      "state-app-agent",
      "retrieve",
      {
        query: "API design patterns",
        sources: ["documentation", "best_practices"],
        limit: 5,
      },
    );
    console.log("Retrieve action:", retrieveAction);

    const learnAction = await client.state.submitAction(
      "state-app-agent",
      "learn",
      {
        fact: "REST APIs should use proper HTTP methods",
        source: "documentation",
        confidence: 0.95,
      },
    );
    console.log("Learn action:", learnAction);

    // 5.2 Get Action Log
    console.log("\n[5.2] Getting action log...");
    const actionLog = await client.state.getActionLog(20);
    console.log(`Action log (${actionLog.length} entries):`);
    actionLog.forEach((a: any) =>
      console.log(
        `  - [${a.actionType}] ${a.actionId} (success: ${a.success})`,
      ),
    );

    // 5.3 Filter Action Log
    console.log("\n[5.3] Getting 'reason' actions only...");
    const reasonActions = await client.state.getActionLog(10, "reason");
    console.log(`Reason actions (${reasonActions.length} entries):`);
    reasonActions.forEach((a: any) =>
      console.log(`  - ${a.actionId}: ${JSON.stringify(a.action)}`),
    );

    // =========================================================================
    // SECTION 6: Decision Cycle
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 6: Decision Cycle");
    console.log("=".repeat(60));

    // 6.1 Run Decision Cycle with Candidates
    console.log("\n[6.1] Running decision cycle with candidates...");
    const cycleResult = await client.state.runCycle("state-app-agent", [
      {
        actionType: "reason",
        action: { thought: "Should analyze data first" },
        score: 0.8,
        rationale: "Data analysis is foundational",
      },
      {
        actionType: "retrieve",
        action: { query: "relevant documentation" },
        score: 0.6,
        rationale: "Documentation might help",
      },
      {
        actionType: "ground",
        action: { tool: "calculator", args: { x: 10, y: 20 } },
        score: 0.3,
        rationale: "Computation might be needed later",
      },
    ]);
    console.log("Cycle result:", cycleResult);

    // 6.2 Run Another Cycle
    console.log("\n[6.2] Running another decision cycle...");
    const cycleResult2 = await client.state.runCycle("state-app-agent", [
      {
        actionType: "learn",
        action: { fact: "New insight discovered" },
        score: 0.9,
        rationale: "Learning from previous action",
      },
    ]);
    console.log("Cycle 2 result:", cycleResult2);

    // 6.3 Get Cycle History
    console.log("\n[6.3] Getting cycle history...");
    const cycleHistory = await client.state.getCycleHistory(10);
    console.log(`Cycle history (${cycleHistory.length} cycles):`);
    cycleHistory.forEach((c: any) =>
      console.log(
        `  - Cycle ${c.cycle_number}: planning=${c.planning_time_ms}ms, execution=${c.execution_time_ms}ms`,
      ),
    );

    // =========================================================================
    // SECTION 7: Cleanup
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("SECTION 7: Cleanup");
    console.log("=".repeat(60));

    console.log("\n[7.1] Deleting run...");
    const deleteSuccess = await client.state.deleteRun();
    console.log("Delete run success:", deleteSuccess);

    console.log("\n" + "=".repeat(60));
    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
  } catch (e: any) {
    console.error("Error:", e.message);
    console.error(e.stack);
  }
}
main();
