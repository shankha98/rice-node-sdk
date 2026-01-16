import { StateClient } from "../state";

export async function execute(name: string, args: any, client: StateClient) {
  switch (name) {
    case "focus":
      return await client.focus(args.content);
    case "recall":
      return await client.reminisce(args.query);
    case "remember":
      if (args.content) {
        return await client.commit(args.content, "Stored in long-term memory", {
          action: "remember",
        });
      }
      return await client.commit(args.input, args.outcome, {
        action: args.action,
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
