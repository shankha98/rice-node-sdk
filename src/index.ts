/**
 * Rice Node SDK
 * Unified client for RiceDB (Storage) and State (AI Memory).
 */

import { Client } from "./Client";
import { statetool } from "./state/tools";

// Re-export types and classes from storage (for typing usage)
export * from "./storage";

// Re-export types and classes from state (for typing usage)
export * from "./state";

// Export Unified Client, Config, and Tools
export * from "./Client";
export * from "./config";
export * from "./state/tools";

export default {
  Client,
  statetool,
};
