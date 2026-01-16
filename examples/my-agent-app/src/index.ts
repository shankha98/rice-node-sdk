import { Client } from "../../../dist";
import { state as anthropicTools } from "../../../dist/tools/anthropic";
import { execute } from "../../../dist/tools/execute";

async function main() {
  const client = new Client();

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
      `[Demo] Loaded ${anthropicTools.length} Anthropic tool definitions.`
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
        console.log(` - ${m.content || JSON.stringify(m)}`)
      );
    } else {
      console.log(result2);
    }
  } catch (e: any) {
    console.error("Agent Error:", e.message || e);
  }
}

main();
