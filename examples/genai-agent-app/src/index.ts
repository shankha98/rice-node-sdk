import { GoogleGenAI, FunctionCallingConfigMode } from "@google/genai";
import { Client } from "../../../dist";
import { state as googleTools } from "../../../dist/tools/google";
import { execute } from "../../../dist/tools/execute";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from tests/remote for SDK config, and local .env for API keys
dotenv.config({ path: path.resolve(__dirname, "../../../tests/remote/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function runAgentWithTools(
  ai: GoogleGenAI,
  modelId: string,
  client: Client,
  prompt: string,
) {
  console.log(`\nUser: ${prompt}`);

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        tools: [{ functionDeclarations: googleTools as any }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    // Handle response
    const calls = response.functionCalls;

    if (calls && calls.length > 0) {
      console.log(`Model requested ${calls.length} tool call(s).`);
      for (const call of calls) {
        if (!call.name) continue;
        console.log(`  Executing ${call.name} with args:`, call.args);
        try {
          const output = await execute(call.name, call.args, client.state);
          console.log(`  Result:`, output);
        } catch (e: any) {
          console.error(`  Tool execution failed:`, e.message);
        }
      }
    } else {
      // Check if text response
      if (response.text) {
        console.log("Model response:", response.text);
      } else {
        console.log("No text or function calls in response.");
      }
    }
  } catch (e: any) {
    console.error("GenAI Error:", e);
  }
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set in .env");
    return;
  }

  const client = new Client({
    configPath: path.resolve(__dirname, "../rice.config.js"),
  });

  try {
    console.log("Connecting to Rice...");
    await client.connect();
    console.log("Connected.");
  } catch (e: any) {
    console.warn("Rice connection failed:", e.message);
    return;
  }

  // Initialize Gemini Client
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const modelId = "gemini-2.5-flash";

  console.log("=".repeat(60));
  console.log("GenAI Agent with State Tools Demo");
  console.log("=".repeat(60));

  // =========================================================================
  // Demo 1: Core Memory Tools
  // =========================================================================
  console.log("\n" + "-".repeat(60));
  console.log("Demo 1: Core Memory Tools");
  console.log("-".repeat(60));

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Please remember that I like coding in TypeScript. Then recall what I like.",
  );

  // Wait a bit for indexing
  console.log("\nWaiting 3s for memory indexing...");
  await new Promise((r) => setTimeout(r, 3000));

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "What do you remember about my preferences?",
  );

  // =========================================================================
  // Demo 2: Working Memory (Variables)
  // =========================================================================
  console.log("\n" + "-".repeat(60));
  console.log("Demo 2: Working Memory (Variables)");
  console.log("-".repeat(60));

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Set a variable called 'current_project' with the value 'Building an AI assistant' and source 'explicit'.",
  );

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "What variables are currently stored in working memory? List them all.",
  );

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Get the value of the 'current_project' variable.",
  );

  // =========================================================================
  // Demo 3: Goal Management
  // =========================================================================
  console.log("\n" + "-".repeat(60));
  console.log("Demo 3: Goal Management");
  console.log("-".repeat(60));

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Add a high-priority goal: 'Complete the SDK integration demo'.",
  );

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Add a medium-priority sub-goal: 'Test all memory tools'.",
  );

  await runAgentWithTools(ai, modelId, client, "List all my current goals.");

  // =========================================================================
  // Demo 4: Actions
  // =========================================================================
  console.log("\n" + "-".repeat(60));
  console.log("Demo 4: Actions");
  console.log("-".repeat(60));

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Submit a 'reason' action for agent 'demo-agent' with the thought: 'The demo is progressing well' and conclusion: 'All tools are functional'.",
  );

  await runAgentWithTools(
    ai,
    modelId,
    client,
    "Show me the action log. I want to see recent actions.",
  );

  // =========================================================================
  // Demo 5: Complex Interaction
  // =========================================================================
  console.log("\n" + "-".repeat(60));
  console.log("Demo 5: Complex Interaction");
  console.log("-".repeat(60));

  await runAgentWithTools(
    ai,
    modelId,
    client,
    `I'm working on an important project. Please:
    1. Store in working memory that my deadline is 'January 25, 2026'
    2. Add a critical goal to 'Ship the project before deadline'
    3. Submit a reason action noting that we need to prioritize testing`,
  );

  console.log("\n" + "=".repeat(60));
  console.log("Demo Complete!");
  console.log("=".repeat(60));
}

main();
