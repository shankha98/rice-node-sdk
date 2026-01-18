import { StateClient } from "../state";

export async function execute(name: string, args: any, client: StateClient) {
  switch (name) {
    // Core Memory Operations
    case "focus":
      return await client.focus(args.content);
    case "drift":
      return await client.drift();
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
    case "trigger":
      return await client.trigger(args.skillName);

    // Working Memory (Structured Variables)
    case "setVariable":
      return await client.setVariable(args.name, args.value, args.source);
    case "getVariable":
      return await client.getVariable(args.name);
    case "listVariables":
      return await client.listVariables();
    case "deleteVariable":
      return await client.deleteVariable(args.name);

    // Concepts
    case "defineConcept":
      return await client.defineConcept(args.name, args.schema);
    case "listConcepts":
      return await client.listConcepts();

    // Goals
    case "addGoal":
      return await client.addGoal(
        args.description,
        args.priority,
        args.parentId,
      );
    case "updateGoal":
      return await client.updateGoal(args.goalId, args.status);
    case "listGoals":
      return await client.listGoals(args.statusFilter);

    // Actions
    case "submitAction":
      return await client.submitAction(
        args.agentId,
        args.actionType,
        args.actionDetails,
      );
    case "getActionLog":
      return await client.getActionLog(args.limit, args.actionTypeFilter);

    // Decision Cycles
    case "runCycle":
      return await client.runCycle(args.agentId, args.candidates);
    case "getCycleHistory":
      return await client.getCycleHistory(args.limit);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
