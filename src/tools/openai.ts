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
];
