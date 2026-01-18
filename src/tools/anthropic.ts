export const state = [
  {
    name: "focus",
    description:
      "Stores a piece of information in working memory (State/Flux).",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The information to focus on.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "recall",
    description: "Recalls relevant memories from State based on a query.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The query to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "remember",
    description: "Stores information in long-term memory for future recall.",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The information to remember.",
        },
      },
      required: ["content"],
    },
  },
  // Working Memory (Structured Variables)
  {
    name: "setVariable",
    description: "Sets a structured variable in working memory.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the variable." },
        value: {
          description: "The value to store (any JSON-serializable type).",
        },
        source: {
          type: "string",
          description:
            "Source of the variable: 'system', 'reasoning', 'retrieval', 'perception', or 'explicit'.",
        },
      },
      required: ["name", "value"],
    },
  },
  {
    name: "getVariable",
    description: "Gets a structured variable from working memory.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the variable to retrieve.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "listVariables",
    description: "Lists all variables in working memory.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "deleteVariable",
    description: "Deletes a variable from working memory.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the variable to delete.",
        },
      },
      required: ["name"],
    },
  },
  // Goals
  {
    name: "addGoal",
    description: "Adds a new goal to the agent's goal stack.",
    input_schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "The description of the goal.",
        },
        priority: {
          type: "string",
          description:
            "Priority level: 'low', 'medium', 'high', or 'critical'.",
        },
        parentId: {
          type: "string",
          description: "Optional parent goal ID for hierarchical goals.",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "updateGoal",
    description: "Updates the status of an existing goal.",
    input_schema: {
      type: "object",
      properties: {
        goalId: {
          type: "string",
          description: "The ID of the goal to update.",
        },
        status: {
          type: "string",
          description:
            "New status: 'active', 'suspended', 'achieved', 'abandoned', or 'failed'.",
        },
      },
      required: ["goalId", "status"],
    },
  },
  {
    name: "listGoals",
    description: "Lists all goals, optionally filtered by status.",
    input_schema: {
      type: "object",
      properties: {
        statusFilter: {
          type: "string",
          description: "Optional status to filter by.",
        },
      },
    },
  },
  // Actions
  {
    name: "submitAction",
    description: "Submits an action for execution and logging.",
    input_schema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "The ID of the agent submitting the action.",
        },
        actionType: {
          type: "string",
          description:
            "Type of action: 'reason', 'retrieve', 'learn', or 'ground'.",
        },
        actionDetails: {
          description: "The action details (any JSON-serializable object).",
        },
      },
      required: ["agentId", "actionType", "actionDetails"],
    },
  },
  {
    name: "getActionLog",
    description: "Gets the action log for the current run.",
    input_schema: {
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
    },
  },
];
