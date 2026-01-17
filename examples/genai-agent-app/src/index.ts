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
  }

  // Initialize Gemini Client
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const modelId = "gemini-2.5-flash";

  const prompt =
    "Please remember that I like coding in TypeScript. Then recall what I like.";
  console.log(`User: ${prompt}`);

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
      console.log(`Model requested ${calls.length} tool calls.`);
      for (const call of calls) {
        if (!call.name) continue;
        console.log(`Executing ${call.name} with args:`, call.args);
        try {
          const output = await execute(call.name, call.args, client.state);
          console.log(`Result:`, output);
        } catch (e: any) {
          console.error(`Tool execution failed:`, e.message);
        }
      }
    } else {
      // Check if text response
      if (response.text) {
        console.log("Model response:", response.text);
      } else {
        console.log("No text or function calls in response.");
        console.log(JSON.stringify(response, null, 2));
      }
    }
  } catch (e: any) {
    console.error("GenAI Error:", e);
  }
}

main();
