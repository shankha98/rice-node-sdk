import { Client } from "../../../dist";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from tests/remote to ensure identical config
dotenv.config({ path: path.resolve(__dirname, "../../../tests/remote/.env") });
import { state as anthropicTools } from "../../../dist/tools/anthropic";
import { execute } from "../../../dist/tools/execute";

async function main() {
  const timestamp = Date.now();
  const runId = `my-agent-run-${timestamp}`;
  console.log(`Run ID: ${runId}`);

  const client = new Client({
    runId,
    configPath: path.resolve(__dirname, "../rice.config.js"),
  });

  try {
    console.log("Connecting to Rice...");
    await client.connect();
    console.log("Connected.");

    // Simulate LLM deciding to use 'remember' tool
    const toolCall = {
      name: "remember",
      args: { content: "User likes coffee" },
    };

    console.log(`[LLM] Calling tool: ${toolCall.name} with`, toolCall.args);

    // Verify definitions are loaded (just for demo)
    console.log(
      `[Demo] Loaded ${anthropicTools.length} Anthropic tool definitions.`,
    );

    // Execute tool
    const result = await execute(toolCall.name, toolCall.args, client.state);
    console.log(`[Tool] Result: ${result}`);

    // Recall
    const toolCall2 = {
      name: "recall",
      args: { query: "coffee" },
    };
    console.log(`[LLM] Calling tool: ${toolCall2.name} with`, toolCall2.args);

    const result2 = await execute(toolCall2.name, toolCall2.args, client.state);
    console.log(`[Tool] Result (Memories):`);
    if (Array.isArray(result2)) {
      result2.forEach((m: any) =>
        console.log(` - ${m.content || JSON.stringify(m)}`),
      );
    } else {
      console.log(result2);
    }
  } catch (e: any) {
    console.error("Agent Error:", e.message || e);
  }
}

main();
