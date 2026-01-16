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
];
