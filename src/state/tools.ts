import { state as google } from "../tools/google";
import { state as openai } from "../tools/openai";
import { state as anthropic } from "../tools/anthropic";
import { execute } from "../tools/execute";
import { createStateTools } from "../tools/vercel";

export const statetool = {
  google,
  openai,
  anthropic,
  execute,
  createVercelTools: createStateTools,
};
