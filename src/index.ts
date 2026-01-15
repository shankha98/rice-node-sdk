/**
 * Rice Node SDK
 * Unified client for RiceDB (Storage) and State (AI Memory).
 */

import { RiceDBClient } from "./storage";
import { StateClient } from "./state";

// Re-export types and classes from storage
export * from "./storage";

// Re-export types and classes from state
export * from "./state";

/**
 * Storage client (RiceDB).
 * Use this to interact with the persistent semantic database.
 *
 * Example:
 * ```ts
 * import { storage } from 'rice-node-sdk';
 * const db = new storage('localhost', 'auto');
 * await db.connect();
 * ```
 */
export const storage = RiceDBClient;

/**
 * State client.
 * Use this to interact with the AI memory system.
 *
 * Example:
 * ```ts
 * import { state } from 'rice-node-sdk';
 * const memory = new state('localhost:50051');
 * ```
 */
export const state = StateClient;

export default {
  storage: RiceDBClient,
  state: StateClient,
};
