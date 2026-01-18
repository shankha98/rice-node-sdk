export const state = [
  {
    name: "focus",
    description:
      "Stores a piece of information in working memory (State/Flux).",
    parameters: {
      type: "OBJECT",
      properties: {
        content: {
          type: "STRING",
          description: "The information to focus on.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "recall",
    description: "Recalls relevant memories from State based on a query.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "The query to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "remember",
    description: "Stores information in long-term memory for future recall.",
    parameters: {
      type: "OBJECT",
      properties: {
        content: {
          type: "STRING",
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
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "The name of the variable." },
        value: {
          type: "STRING",
          description: "The value to store (JSON-encoded).",
        },
        source: {
          type: "STRING",
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
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description: "The name of the variable to retrieve.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "listVariables",
    description: "Lists all variables in working memory.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "deleteVariable",
    description: "Deletes a variable from working memory.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
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
    parameters: {
      type: "OBJECT",
      properties: {
        description: {
          type: "STRING",
          description: "The description of the goal.",
        },
        priority: {
          type: "STRING",
          description:
            "Priority level: 'low', 'medium', 'high', or 'critical'.",
        },
        parentId: {
          type: "STRING",
          description: "Optional parent goal ID for hierarchical goals.",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "updateGoal",
    description: "Updates the status of an existing goal.",
    parameters: {
      type: "OBJECT",
      properties: {
        goalId: {
          type: "STRING",
          description: "The ID of the goal to update.",
        },
        status: {
          type: "STRING",
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
    parameters: {
      type: "OBJECT",
      properties: {
        statusFilter: {
          type: "STRING",
          description: "Optional status to filter by.",
        },
      },
    },
  },
  // Actions
  {
    name: "submitAction",
    description: "Submits an action for execution and logging.",
    parameters: {
      type: "OBJECT",
      properties: {
        agentId: {
          type: "STRING",
          description: "The ID of the agent submitting the action.",
        },
        actionType: {
          type: "STRING",
          description:
            "Type of action: 'reason', 'retrieve', 'learn', or 'ground'.",
        },
        actionDetails: {
          type: "STRING",
          description: "The action details (JSON-encoded object).",
        },
      },
      required: ["agentId", "actionType", "actionDetails"],
    },
  },
  {
    name: "getActionLog",
    description: "Gets the action log for the current run.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: {
          type: "NUMBER",
          description: "Maximum number of entries to retrieve.",
        },
        actionTypeFilter: {
          type: "STRING",
          description: "Optional action type to filter by.",
        },
      },
    },
  },
];
