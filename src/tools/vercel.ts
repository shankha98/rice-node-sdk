/**
 * Vercel AI SDK v6 compatible tool definitions for Rice State service.
 *
 * Usage with Vercel AI SDK:
 * ```typescript
 * import { generateText } from 'ai';
 * import { createStateTools } from 'rice-node-sdk/tools/vercel';
 *
 * const tools = createStateTools(client.state);
 * const result = await generateText({
 *   model: yourModel,
 *   tools,
 *   prompt: 'Remember that I like TypeScript',
 * });
 * ```
 */

import { jsonSchema, tool } from "@ai-sdk/provider-utils";
import { StateClient } from "../state";

/**
 * Creates Vercel AI SDK v6 compatible tools bound to a StateClient instance.
 * Each tool uses the `tool()` helper from @ai-sdk/provider-utils for proper typing.
 */
export function createStateTools(client: StateClient) {
  return {
    // Core Memory Operations
    focus: tool({
      description: "Stores information in short-term working memory (Flux).",
      inputSchema: jsonSchema<{ content: string }>({
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The information to focus on.",
          },
        },
        required: ["content"],
      }),
      execute: async ({ content }) => client.focus(content),
    }),

    drift: tool({
      description:
        "Reads the current items in short-term working memory (Flux).",
      inputSchema: jsonSchema<Record<string, never>>({
        type: "object",
        properties: {},
      }),
      execute: async () => client.drift(),
    }),

    recall: tool({
      description:
        "Recalls relevant memories from long-term memory based on a semantic query.",
      inputSchema: jsonSchema<{ query: string }>({
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The query to search for in memories.",
          },
        },
        required: ["query"],
      }),
      execute: async ({ query }) => client.reminisce(query),
    }),

    remember: tool({
      description: "Stores information in long-term memory for future recall.",
      inputSchema: jsonSchema<{ content: string }>({
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The information to remember.",
          },
        },
        required: ["content"],
      }),
      execute: async ({ content }) =>
        client.commit(content, "Stored in long-term memory", {
          action: "remember",
        }),
    }),

    trigger: tool({
      description: "Triggers a registered skill or procedure by name.",
      inputSchema: jsonSchema<{ skillName: string }>({
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "The name of the skill to trigger.",
          },
        },
        required: ["skillName"],
      }),
      execute: async ({ skillName }) => client.trigger(skillName),
    }),

    // Working Memory (Structured Variables)
    setVariable: tool({
      description: "Sets a structured variable in working memory.",
      inputSchema: jsonSchema<{ name: string; value: any; source?: string }>({
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the variable.",
          },
          value: {
            description: "The value to store (any JSON-serializable type).",
          },
          source: {
            type: "string",
            description:
              "Source: 'system', 'reasoning', 'retrieval', 'perception', or 'explicit'.",
          },
        },
        required: ["name", "value"],
      }),
      execute: async ({ name, value, source }) =>
        client.setVariable(name, value, source),
    }),

    getVariable: tool({
      description: "Gets a structured variable from working memory.",
      inputSchema: jsonSchema<{ name: string }>({
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the variable to retrieve.",
          },
        },
        required: ["name"],
      }),
      execute: async ({ name }) => client.getVariable(name),
    }),

    listVariables: tool({
      description: "Lists all variables in working memory.",
      inputSchema: jsonSchema<Record<string, never>>({
        type: "object",
        properties: {},
      }),
      execute: async () => client.listVariables(),
    }),

    deleteVariable: tool({
      description: "Deletes a variable from working memory.",
      inputSchema: jsonSchema<{ name: string }>({
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the variable to delete.",
          },
        },
        required: ["name"],
      }),
      execute: async ({ name }) => client.deleteVariable(name),
    }),

    // Concepts
    defineConcept: tool({
      description:
        "Defines a concept with a JSON schema for structured knowledge.",
      inputSchema: jsonSchema<{ name: string; schema: Record<string, any> }>({
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the concept.",
          },
          schema: {
            type: "object",
            description: "The JSON schema defining the concept structure.",
          },
        },
        required: ["name", "schema"],
      }),
      execute: async ({ name, schema }) => client.defineConcept(name, schema),
    }),

    listConcepts: tool({
      description: "Lists all defined concepts and their schemas.",
      inputSchema: jsonSchema<Record<string, never>>({
        type: "object",
        properties: {},
      }),
      execute: async () => client.listConcepts(),
    }),

    // Goals
    addGoal: tool({
      description: "Adds a goal to the agent's goal stack.",
      inputSchema: jsonSchema<{
        description: string;
        priority?: string;
        parentId?: string;
      }>({
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description of the goal.",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Priority level of the goal.",
          },
          parentId: {
            type: "string",
            description: "Optional parent goal ID for hierarchical goals.",
          },
        },
        required: ["description"],
      }),
      execute: async ({ description, priority, parentId }) =>
        client.addGoal(description, priority, parentId),
    }),

    updateGoal: tool({
      description: "Updates a goal's status.",
      inputSchema: jsonSchema<{ goalId: string; status: string }>({
        type: "object",
        properties: {
          goalId: {
            type: "string",
            description: "The ID of the goal to update.",
          },
          status: {
            type: "string",
            enum: ["active", "suspended", "achieved", "abandoned", "failed"],
            description: "New status for the goal.",
          },
        },
        required: ["goalId", "status"],
      }),
      execute: async ({ goalId, status }) => client.updateGoal(goalId, status),
    }),

    listGoals: tool({
      description: "Lists all goals, optionally filtered by status.",
      inputSchema: jsonSchema<{ statusFilter?: string }>({
        type: "object",
        properties: {
          statusFilter: {
            type: "string",
            enum: ["active", "suspended", "achieved", "abandoned", "failed"],
            description: "Optional status to filter goals by.",
          },
        },
      }),
      execute: async ({ statusFilter }) => client.listGoals(statusFilter),
    }),

    // Actions
    submitAction: tool({
      description: "Submits an action for execution and logging.",
      inputSchema: jsonSchema<{
        agentId: string;
        actionType: string;
        actionDetails: Record<string, any>;
      }>({
        type: "object",
        properties: {
          agentId: {
            type: "string",
            description: "The ID of the agent submitting the action.",
          },
          actionType: {
            type: "string",
            enum: ["reason", "retrieve", "learn", "ground"],
            description: "Type of action.",
          },
          actionDetails: {
            type: "object",
            description: "The action details.",
          },
        },
        required: ["agentId", "actionType", "actionDetails"],
      }),
      execute: async ({ agentId, actionType, actionDetails }) =>
        client.submitAction(agentId, actionType, actionDetails),
    }),

    getActionLog: tool({
      description: "Gets the action log for the current run.",
      inputSchema: jsonSchema<{ limit?: number; actionTypeFilter?: string }>({
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of entries to retrieve.",
          },
          actionTypeFilter: {
            type: "string",
            description: "Optional action type to filter by.",
          },
        },
      }),
      execute: async ({ limit, actionTypeFilter }) =>
        client.getActionLog(limit, actionTypeFilter),
    }),

    // Decision Cycles
    runCycle: tool({
      description: "Runs a decision cycle with optional action candidates.",
      inputSchema: jsonSchema<{
        agentId: string;
        candidates?: Array<{
          actionType: string;
          action: Record<string, any>;
          score: number;
          rationale: string;
        }>;
      }>({
        type: "object",
        properties: {
          agentId: {
            type: "string",
            description: "The ID of the agent running the cycle.",
          },
          candidates: {
            type: "array",
            description: "Optional array of action candidates with scores.",
            items: {
              type: "object",
              properties: {
                actionType: { type: "string" },
                action: { type: "object" },
                score: { type: "number" },
                rationale: { type: "string" },
              },
            },
          },
        },
        required: ["agentId"],
      }),
      execute: async ({ agentId, candidates }) =>
        client.runCycle(agentId, candidates),
    }),

    getCycleHistory: tool({
      description: "Gets the history of decision cycles for the current run.",
      inputSchema: jsonSchema<{ limit?: number }>({
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of cycles to retrieve.",
          },
        },
      }),
      execute: async ({ limit }) => client.getCycleHistory(limit),
    }),
  };
}

/**
 * Tool names available in the state tools.
 */
export const stateToolNames = [
  "focus",
  "drift",
  "recall",
  "remember",
  "trigger",
  "setVariable",
  "getVariable",
  "listVariables",
  "deleteVariable",
  "defineConcept",
  "listConcepts",
  "addGoal",
  "updateGoal",
  "listGoals",
  "submitAction",
  "getActionLog",
  "runCycle",
  "getCycleHistory",
] as const;

export type StateToolName = (typeof stateToolNames)[number];
