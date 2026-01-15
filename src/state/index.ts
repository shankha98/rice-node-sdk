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
    runId: string = "default"
  ) {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const protoDescriptor = grpc.loadPackageDefinition(
      packageDefinition
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
        }
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
        }
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
    options?: { action?: string; reasoning?: string; agent_id?: string }
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
   * @returns A promise that resolves to an array of traces/memories.
   */
  reminisce(query: string, limit: number = 5): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const req = {
        embedding: [],
        limit,
        query_text: query,
        run_id: this.runId,
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
        }
      );
    });
  }
}
