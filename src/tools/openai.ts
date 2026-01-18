export const state = [
  {
    type: "function",
    function: {
      name: "focus",
      description:
        "Stores a piece of information in working memory (State/Flux).",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "recall",
      description: "Recalls relevant memories from State based on a query.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The query to search for." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remember",
      description: "Stores information in long-term memory for future recall.",
      parameters: {
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
  },
  // Working Memory (Structured Variables)
  {
    type: "function",
    function: {
      name: "setVariable",
      description: "Sets a structured variable in working memory.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "getVariable",
      description: "Gets a structured variable from working memory.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "listVariables",
      description: "Lists all variables in working memory.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteVariable",
      description: "Deletes a variable from working memory.",
      parameters: {
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
  },
  // Goals
  {
    type: "function",
    function: {
      name: "addGoal",
      description: "Adds a new goal to the agent's goal stack.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "updateGoal",
      description: "Updates the status of an existing goal.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "listGoals",
      description: "Lists all goals, optionally filtered by status.",
      parameters: {
        type: "object",
        properties: {
          statusFilter: {
            type: "string",
            description: "Optional status to filter by.",
          },
        },
      },
    },
  },
  // Actions
  {
    type: "function",
    function: {
      name: "submitAction",
      description: "Submits an action for execution and logging.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "getActionLog",
      description: "Gets the action log for the current run.",
      parameters: {
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
  },
  // Drift (Read Working Memory)
  {
    type: "function",
    function: {
      name: "drift",
      description:
        "Reads the current items in short-term working memory (Flux).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  // Concepts
  {
    type: "function",
    function: {
      name: "defineConcept",
      description:
        "Defines a concept with a JSON schema for structured knowledge.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the concept.",
          },
          schema: {
            description: "The JSON schema defining the concept structure.",
          },
        },
        required: ["name", "schema"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listConcepts",
      description: "Lists all defined concepts and their schemas.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  // Decision Cycles
  {
    type: "function",
    function: {
      name: "runCycle",
      description:
        "Runs a decision cycle with optional action candidates. The system will select and execute the best action.",
      parameters: {
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
                actionType: { type: "string", description: "Type of action." },
                action: { description: "The action details." },
                score: {
                  type: "number",
                  description: "Score between 0 and 1.",
                },
                rationale: {
                  type: "string",
                  description: "Explanation for this candidate.",
                },
              },
            },
          },
        },
        required: ["agentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCycleHistory",
      description: "Gets the history of decision cycles for the current run.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of cycles to retrieve.",
          },
        },
      },
    },
  },
  // Skills
  {
    type: "function",
    function: {
      name: "trigger",
      description: "Triggers a registered skill or procedure by name.",
      parameters: {
        type: "object",
        properties: {
          skillName: {
            type: "string",
            description: "The name of the skill to trigger.",
          },
        },
        required: ["skillName"],
      },
    },
  },
];
