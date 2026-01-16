export const state = [
  {
    type: "function",
    function: {
      name: "remember",
      description:
        "Stores a piece of information in working memory (State/Flux).",
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
      name: "save_experience",
      description: "Saves an interaction experience to long-term memory.",
      parameters: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "The user input or trigger.",
          },
          outcome: { type: "string", description: "The result or outcome." },
          action: { type: "string", description: "The action taken." },
        },
        required: ["input", "outcome", "action"],
      },
    },
  },
];
