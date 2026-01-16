import { state as google } from "../tools/google";
import { state as openai } from "../tools/openai";
import { state as anthropic } from "../tools/anthropic";
import { execute } from "../tools/execute";

export const statetool = {
  google,
  openai,
  anthropic,
  execute,
};
