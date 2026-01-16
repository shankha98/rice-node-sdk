export const state = [
  {
    name: "remember",
    description:
      "Stores a piece of information in working memory (State/Flux).",
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
    name: "save_experience",
    description: "Saves an interaction experience to long-term memory.",
    parameters: {
      type: "OBJECT",
      properties: {
        input: { type: "STRING", description: "The user input or trigger." },
        outcome: { type: "STRING", description: "The result or outcome." },
        action: { type: "STRING", description: "The action taken." },
      },
      required: ["input", "outcome", "action"],
    },
  },
];
