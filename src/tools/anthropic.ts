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
];
