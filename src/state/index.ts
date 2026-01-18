import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";

// For library usage, we expect proto file to be in ./proto relative to built file
// But since we use protoLoader, we need the file present.
const PROTO_PATH = path.join(__dirname, "proto", "state.proto");

/**
 * Client for interacting with State (AI Memory).
 * Provides methods for managing conversational memory, drift, and skills.
 */
export class StateClient {
  private client: any;
  private metadata: any;
  private runId: string;

  /**
   * Creates an instance of StateClient.
   * @param address - The address of the State service (e.g., "localhost:50051").
   * @param token - Optional authorization token.
   * @param runId - Unique identifier for the current run/session. Defaults to "default".
   */
  constructor(
    address: string = "localhost:50051",
    token?: string,
    runId: string = "default",
  ) {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const protoDescriptor = grpc.loadPackageDefinition(
      packageDefinition,
    ) as any;

    // Internal usage: The proto package is still 'slate' for compatibility
    const slate = protoDescriptor.slate;
    this.client = new slate.Cortex(address, grpc.credentials.createInsecure());

    this.metadata = new grpc.Metadata();
    if (token) {
      this.metadata.add("authorization", token);
    }
    this.runId = runId;
  }

  /**
   * Sets the run ID for subsequent operations.
   * @param runId - The new run ID to use.
   */
  setRunId(runId: string) {
    this.runId = runId;
  }

  /**
   * Focuses the state on a specific content or context.
   * @param content - The content to focus on.
   * @returns A promise that resolves to the ID of the focus operation.
   */
  focus(content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.Focus(
        { content, run_id: this.runId },
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response.id);
        },
      );
    });
  }

  /**
   * Retrieves the current drift or context drift items.
   * @returns A promise that resolves to an array of drift items.
   */
  drift(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.client.Drift(
        { run_id: this.runId },
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response.items || []);
        },
      );
    });
  }

  /**
   * Commits a trace of an interaction (input/outcome) to memory.
   * @param input - The input or prompt.
   * @param outcome - The result or response.
   * @param options - Optional parameters including action, reasoning, and agent_id.
   * @returns A promise that resolves to true if successful.
   */
  commit(
    input: string,
    outcome: string,
    options?: { action?: string; reasoning?: string; agent_id?: string },
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const trace = {
        input,
        outcome,
        reasoning: options?.reasoning || "Node Client",
        action: options?.action || "Action",
        agent_id: options?.agent_id || "node-user",
        embedding: [], // Mock
        run_id: this.runId,
      };
      this.client.Commit(trace, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.success);
      });
    });
  }

  /**
   * Recalls past memories relevant to a query.
   * @param query - The query text to search for memories.
   * @param limit - Maximum number of memories to retrieve. Defaults to 5.
   * @param filter - Optional metadata filter.
   * @returns A promise that resolves to an array of traces/memories.
   */
  reminisce(
    query: string,
    limit: number = 5,
    filter?: { [key: string]: any },
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const req = {
        embedding: [],
        limit,
        query_text: query,
        run_id: this.runId,
        filter: filter ? JSON.stringify(filter) : undefined,
      };
      this.client.Reminisce(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.traces || []);
      });
    });
  }

  /**
   * Triggers a specific skill or action.
   * @param skillName - The name of the skill to trigger.
   * @returns A promise that resolves to the result code (number).
   */
  trigger(skillName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = {
        skill_name: skillName,
      };
      this.client.Trigger(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.result);
      });
    });
  }

  /**
   * Deletes the current run/session and its associated data.
   * @returns A promise that resolves to true if successful.
   */
  deleteRun(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.DeleteRun(
        { run_id: this.runId },
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response.success);
        },
      );
    });
  }

  // ==========================================================================
  // Working Memory (Structured Variables)
  // ==========================================================================

  /**
   * Sets a variable in working memory.
   * @param name - The name of the variable.
   * @param value - The value to store (will be JSON-encoded).
   * @param source - The source of the variable. Defaults to "explicit".
   * @returns A promise that resolves to true if successful.
   */
  setVariable(
    name: string,
    value: any,
    source: string = "explicit",
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        name,
        value_json: JSON.stringify(value),
        source,
      };
      this.client.SetVariable(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.success);
      });
    });
  }

  /**
   * Gets a variable from working memory.
   * @param name - The name of the variable to retrieve.
   * @returns A promise that resolves to the variable details including value, type, and metadata.
   */
  getVariable(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        name,
      };
      this.client.GetVariable(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else
          resolve({
            name: response.name,
            value: JSON.parse(response.value_json || "null"),
            varType: response.var_type,
            createdAt: response.created_at,
            lastUpdated: response.last_updated,
            accessCount: response.access_count,
            source: response.source,
          });
      });
    });
  }

  /**
   * Lists all variables in working memory.
   * @returns A promise that resolves to an array of variables.
   */
  listVariables(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.client.ListVariables(
        { run_id: this.runId },
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else
            resolve(
              (response.variables || []).map((v: any) => ({
                name: v.name,
                value: JSON.parse(v.value_json || "null"),
                varType: v.var_type,
                source: v.source,
              })),
            );
        },
      );
    });
  }

  /**
   * Deletes a variable from working memory.
   * @param name - The name of the variable to delete.
   * @returns A promise that resolves to true if successful.
   */
  deleteVariable(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        name,
      };
      this.client.DeleteVariable(
        req,
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response.success);
        },
      );
    });
  }

  // ==========================================================================
  // Concepts (Level 4 Agency)
  // ==========================================================================

  /**
   * Defines a concept with a schema.
   * @param name - The name of the concept.
   * @param schema - The schema definition (object or JSON string).
   * @returns A promise that resolves to true if successful.
   */
  defineConcept(name: string, schema: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        name,
        schema_json:
          typeof schema === "string" ? schema : JSON.stringify(schema),
      };
      this.client.DefineConcept(
        req,
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response.success);
        },
      );
    });
  }

  /**
   * Lists all defined concepts.
   * @returns A promise that resolves to an array of concepts with their schemas.
   */
  listConcepts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
      };
      this.client.ListConcepts(
        req,
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else
            resolve(
              (response.concepts || []).map((c: any) => ({
                name: c.name,
                schema: JSON.parse(c.schema_json || "{}"),
              })),
            );
        },
      );
    });
  }

  // ==========================================================================
  // Goals
  // ==========================================================================

  /**
   * Adds a new goal.
   * @param description - The description of the goal.
   * @param priority - The priority level ("low", "medium", "high", "critical"). Defaults to "medium".
   * @param parentId - Optional parent goal ID for hierarchical goals.
   * @returns A promise that resolves to the created goal details.
   */
  addGoal(
    description: string,
    priority: string = "medium",
    parentId?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        description,
        priority,
        parent_id: parentId || "",
      };
      this.client.AddGoal(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  /**
   * Updates a goal's status.
   * @param goalId - The ID of the goal to update.
   * @param status - The new status ("active", "suspended", "achieved", "abandoned", "failed").
   * @returns A promise that resolves to true if successful.
   */
  updateGoal(goalId: string, status: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        goal_id: goalId,
        status,
      };
      this.client.UpdateGoal(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.success);
      });
    });
  }

  /**
   * Lists all goals, optionally filtered by status.
   * @param statusFilter - Optional status to filter by.
   * @returns A promise that resolves to an array of goals.
   */
  listGoals(statusFilter?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        status_filter: statusFilter || "",
      };
      this.client.ListGoals(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.goals || []);
      });
    });
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Submits an action for execution.
   * @param agentId - The ID of the agent submitting the action.
   * @param actionType - The type of action ("reason", "retrieve", "learn", "ground").
   * @param actionDetails - The action details (will be JSON-encoded).
   * @returns A promise that resolves to the action result.
   */
  submitAction(
    agentId: string,
    actionType: string,
    actionDetails: any,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        agent_id: agentId,
        action_type: actionType,
        action_json: JSON.stringify(actionDetails),
      };
      this.client.SubmitAction(
        req,
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else
            resolve({
              actionId: response.action_id,
              success: response.success,
              result: response.result_json
                ? JSON.parse(response.result_json)
                : null,
              error: response.error,
              durationMs: response.duration_ms,
            });
        },
      );
    });
  }

  /**
   * Gets the action log for the current run.
   * @param limit - Maximum number of entries to retrieve. Defaults to 100.
   * @param actionTypeFilter - Optional action type to filter by.
   * @returns A promise that resolves to an array of action log entries.
   */
  getActionLog(limit: number = 100, actionTypeFilter?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        limit,
        action_type_filter: actionTypeFilter || "",
      };
      this.client.GetActionLog(
        req,
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else
            resolve(
              (response.entries || []).map((e: any) => ({
                actionId: e.action_id,
                actionType: e.action_type,
                action: e.action_json ? JSON.parse(e.action_json) : null,
                success: e.success,
                result: e.result_json ? JSON.parse(e.result_json) : null,
                cycleNumber: e.cycle_number,
                timestamp: e.timestamp,
              })),
            );
        },
      );
    });
  }

  // ==========================================================================
  // Decision Cycle
  // ==========================================================================

  /**
   * Runs a decision cycle, optionally with pre-proposed action candidates.
   * @param agentId - The ID of the agent running the cycle.
   * @param candidates - Optional array of action candidates with scores and rationales.
   * @returns A promise that resolves to the cycle result.
   */
  runCycle(agentId: string, candidates?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        agent_id: agentId,
        candidates: (candidates || []).map((c) => ({
          action_type: c.actionType,
          action_json: JSON.stringify(c.action),
          score: c.score,
          rationale: c.rationale || "",
        })),
      };
      this.client.RunCycle(req, this.metadata, (err: any, response: any) => {
        if (err) reject(err);
        else
          resolve({
            cycleNumber: response.cycle_number,
            selectedAction: response.selected_action,
            actionResult: response.action_result,
            planningTimeMs: response.planning_time_ms,
            executionTimeMs: response.execution_time_ms,
            timestamp: response.timestamp,
          });
      });
    });
  }

  /**
   * Gets the decision cycle history for the current run.
   * @param limit - Maximum number of cycles to retrieve. Defaults to 100.
   * @returns A promise that resolves to an array of cycle records.
   */
  getCycleHistory(limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const req = {
        run_id: this.runId,
        limit,
      };
      this.client.GetCycleHistory(
        req,
        this.metadata,
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response.cycles || []);
        },
      );
    });
  }
}
