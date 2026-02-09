import { StateClient } from "../src/index";

const runId = "multi-agent-demo-" + Date.now();

async function createAgent(id: string, role: string) {
  const client = new StateClient("localhost:50051", undefined, runId);
  console.log(`[${id}] (${role}) Online`);
  return client;
}

async function main() {
  const agent1 = await createAgent("Agent-1", "Starter");
  const agent2 = await createAgent("Agent-2", "Processor A");
  const agent3 = await createAgent("Agent-3", "Processor B");
  const agent4 = await createAgent("Agent-4", "Finisher");

  // Subscribe all agents

  // Agent 2 Listener
  const stream2 = agent2.subscribe(["VariableUpdate"]);
  stream2.on("data", async (event: any) => {
    try {
      if (event.type !== "VariableUpdate") return;
      const variable = JSON.parse(event.payload);
      // variable.value_json is a JSON string of the value
      if (variable.name === "step" && variable.value_json === "1") {
        console.log(`[Agent-2] Detected Step 1. Processing...`);
        await new Promise((r) => setTimeout(r, 1000)); // Simulate work
        await agent2.setVariable("step", 2);
        console.log(`[Agent-2] Set Step 2`);
      }
    } catch (e) {
      console.error("[Agent-2] Error processing event", e);
    }
  });

  // Agent 3 Listener
  const stream3 = agent3.subscribe(["VariableUpdate"]);
  stream3.on("data", async (event: any) => {
    try {
      if (event.type !== "VariableUpdate") return;
      const variable = JSON.parse(event.payload);
      if (variable.name === "step" && variable.value_json === "2") {
        console.log(`[Agent-3] Detected Step 2. Processing...`);
        await new Promise((r) => setTimeout(r, 1000));
        await agent3.setVariable("step", 3);
        console.log(`[Agent-3] Set Step 3`);
      }
    } catch (e) {
      console.error("[Agent-3] Error processing event", e);
    }
  });

  // Agent 4 Listener
  const stream4 = agent4.subscribe(["VariableUpdate"]);
  stream4.on("data", async (event: any) => {
    try {
      if (event.type !== "VariableUpdate") return;
      const variable = JSON.parse(event.payload);
      if (variable.name === "step" && variable.value_json === "3") {
        console.log(`[Agent-4] Detected Step 3. Finalizing...`);
        await new Promise((r) => setTimeout(r, 1000));
        await agent4.setVariable("step", 4);
        console.log(`[Agent-4] Workflow Complete!`);
        process.exit(0);
      }
    } catch (e) {
      console.error("[Agent-4] Error processing event", e);
    }
  });

  console.log("Starting Workflow in 2 seconds...");
  await new Promise((r) => setTimeout(r, 2000));

  // Agent 1 triggers the workflow
  console.log(`[Agent-1] Setting Step 1`);
  await agent1.setVariable("step", 1);

  // Keep alive for a bit if not completed
  setTimeout(() => {
    console.log("Timeout reached.");
    process.exit(1);
  }, 15000);
}

main().catch(console.error);
