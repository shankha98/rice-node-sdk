import {
  BaseRiceDBClient,
  HealthInfo,
  InsertResult,
  SearchResultItem,
  MemoryEntry,
} from "./BaseClient";
import { GrpcClient } from "./GrpcClient";
import { HttpClient } from "./HttpClient";
import Long from "long";
import { BitVector } from "../utils/BitVector";

/**
 * Client for RiceDB (Persistent Semantic Database).
 * Supports both gRPC and HTTP transports.
 */
export class RiceDBClient extends BaseRiceDBClient {
  private client: BaseRiceDBClient | null = null;
  private transport: "grpc" | "http" | "auto";
  private _grpcPort: number;
  private _httpPort: number;
  private token: string | undefined;
  private runId: string | undefined;

  /**
   * Creates a new RiceDB client instance.
   * @param host - The hostname of the RiceDB server (default: "localhost").
   * @param transport - The transport protocol to use: "grpc", "http", or "auto" (default: "auto").
   * @param grpcPort - The port for gRPC connections (default: 50051).
   * @param httpPort - The port for HTTP connections (default: 3000).
   * @param token - Optional authentication token.
   * @param runId - Optional run identifier for storage data isolation.
   */
  constructor(
    host: string = "localhost",
    transport: "grpc" | "http" | "auto" = "auto",
    grpcPort: number = 50051,
    httpPort: number = 3000,
    token?: string,
    runId?: string,
  ) {
    super(host, 0);
    this.transport = transport;
    this._grpcPort = grpcPort;
    this._httpPort = httpPort;
    this.token = token;
    this.runId = runId;
  }

  setRunId(runId: string) {
    this.runId = runId;
  }

  /**
   * Connects to the RiceDB server.
   * If transport is "auto", tries gRPC first, then falls back to HTTP.
   * @returns A promise that resolves to true if connected successfully.
   */
  async connect(): Promise<boolean> {
    if (this.transport === "grpc") {
      this.client = new GrpcClient(this.host, this._grpcPort, this.token);
      await this.client.connect();
      this.connected = true;
      return true;
    } else if (this.transport === "http") {
      this.client = new HttpClient(this.host, this._httpPort, this.token);
      await this.client.connect();
      this.connected = true;
      return true;
    } else {
      // Auto
      try {
        const grpcClient = new GrpcClient(
          this.host,
          this._grpcPort,
          this.token
        );
        await grpcClient.connect();
        this.client = grpcClient;
        this.connected = true;
        return true;
      } catch (e) {
        // Fallback
        console.warn("gRPC connection failed, falling back to HTTP");
        this.client = new HttpClient(this.host, this._httpPort, this.token);
        await this.client.connect();
        this.connected = true;
        return true;
      }
    }
  }

  /**
   * Disconnects from the RiceDB server.
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.connected = false;
  }

  private checkConnected() {
    if (!this.client) throw new Error("Not connected");
  }

  /**
   * Checks the health of the RiceDB server.
   * @returns Detailed health information.
   */
  async health(): Promise<HealthInfo> {
    this.checkConnected();
    return this.client!.health();
  }

  /**
   * Logs in a user.
   * @param username - The username.
   * @param password - The password.
   * @returns An authentication token or session ID.
   */
  async login(username: string, password: string): Promise<string> {
    this.checkConnected();
    return this.client!.login(username, password);
  }

  /**
   * Creates a new user.
   * @param username - The username.
   * @param password - The password.
   * @param role - Optional role for the user.
   * @returns The ID of the created user.
   */
  async createUser(
    username: string,
    password: string,
    role?: string
  ): Promise<Long> {
    this.checkConnected();
    return this.client!.createUser(username, password, role);
  }

  /**
   * Deletes a user.
   * @param username - The username to delete.
   * @returns True if successful.
   */
  async deleteUser(username: string): Promise<boolean> {
    this.checkConnected();
    return this.client!.deleteUser(username);
  }

  /**
   * Retrieves user details.
   * @param username - The username.
   * @returns User details object.
   */
  async getUser(username: string): Promise<any> {
    this.checkConnected();
    return this.client!.getUser(username);
  }

  /**
   * Lists all users.
   * @returns An array of user objects.
   */
  async listUsers(): Promise<any[]> {
    this.checkConnected();
    return this.client!.listUsers();
  }

  /**
   * Inserts a document/node into the database.
   * @param nodeId - Unique identifier for the node.
   * @param text - The text content.
   * @param metadata - Arbitrary metadata object.
   * @param userId - The ID of the user inserting.
   * @param sessionId - Optional session ID.
   * @param embedding - Optional pre-computed embedding vector.
   * @returns Result of the insertion.
   */
  async insert(
    nodeId: Long | number | string,
    text: string,
    metadata: any,
    userId: Long | number | string = 1,
    sessionId?: string,
    embedding?: number[],
    runId?: string,
  ): Promise<InsertResult> {
    this.checkConnected();
    return this.client!.insert(
      nodeId,
      text,
      metadata,
      userId,
      sessionId,
      embedding,
      runId || this.runId,
    );
  }

  /**
   * Searches for similar documents/nodes.
   * @param query - The query text.
   * @param userId - The user ID performing the search.
   * @param k - Number of results to return (default: 10).
   * @param sessionId - Optional session ID to filter by.
   * @param filter - Metadata filter criteria.
   * @param queryEmbedding - Optional query embedding vector.
   * @returns An array of search results.
   */
  async search(
    query: string,
    userId: Long | number | string,
    k: number = 10,
    sessionId?: string,
    filter?: { [key: string]: any },
    queryEmbedding?: number[],
    runId?: string,
  ): Promise<SearchResultItem[]> {
    this.checkConnected();
    return this.client!.search(
      query,
      userId,
      k,
      sessionId,
      filter,
      queryEmbedding,
      runId || this.runId,
    );
  }

  /**
   * Deletes a document/node.
   * @param nodeId - The ID of the node to delete.
   * @param sessionId - Optional session ID.
   * @returns True if successful.
   */
  async delete(
    nodeId: Long | number | string,
    sessionId?: string
  ): Promise<boolean> {
    this.checkConnected();
    return this.client!.delete(nodeId, sessionId);
  }

  async deleteRun(
    runId?: string,
  ): Promise<{ success: boolean; message: string; count: Long }> {
    this.checkConnected();
    const targetRunId = runId || this.runId;
    if (!targetRunId) {
      throw new Error("runId is required for deleteRun");
    }
    return this.client!.deleteRun(targetRunId);
  }

  /**
   * Creates a new session.
   * @param parentSessionId - Optional parent session ID to fork from.
   * @returns The new session ID.
   */
  async createSession(parentSessionId?: string): Promise<string> {
    this.checkConnected();
    return this.client!.createSession(parentSessionId);
  }

  /**
   * Saves a snapshot of a session to disk.
   * @param sessionId - The session ID.
   * @param path - The file path to save to.
   * @returns True if successful.
   */
  async snapshotSession(sessionId: string, path: string): Promise<boolean> {
    this.checkConnected();
    return this.client!.snapshotSession(sessionId, path);
  }

  /**
   * Loads a session from a snapshot.
   * @param path - The file path to load from.
   * @returns The loaded session ID.
   */
  async loadSession(path: string): Promise<string> {
    this.checkConnected();
    return this.client!.loadSession(path);
  }

  /**
   * Commits changes in a session (e.g., merging back).
   * @param sessionId - The session ID.
   * @param mergeStrategy - Strategy for merging ("overwrite", etc.).
   * @returns True if successful.
   */
  async commitSession(
    sessionId: string,
    mergeStrategy: string = "overwrite"
  ): Promise<boolean> {
    this.checkConnected();
    return this.client!.commitSession(sessionId, mergeStrategy);
  }

  /**
   * Drops (deletes) a session.
   * @param sessionId - The session ID.
   * @returns True if successful.
   */
  async dropSession(sessionId: string): Promise<boolean> {
    this.checkConnected();
    return this.client!.dropSession(sessionId);
  }

  /**
   * Writes raw data to memory at a specific address.
   * @param address - The memory address (BitVector).
   * @param data - The data to write (BitVector).
   * @param userId - The user ID.
   * @returns Success status and message.
   */
  async writeMemory(
    address: BitVector,
    data: BitVector,
    userId: Long | number | string = 1
  ): Promise<{ success: boolean; message: string }> {
    this.checkConnected();
    return this.client!.writeMemory(address, data, userId);
  }

  /**
   * Reads raw data from memory at a specific address.
   * @param address - The memory address (BitVector).
   * @param userId - The user ID.
   * @returns The data at the address (BitVector).
   */
  async readMemory(
    address: BitVector,
    userId: Long | number | string = 1
  ): Promise<BitVector> {
    this.checkConnected();
    return this.client!.readMemory(address, userId);
  }

  /**
   * Adds a high-level memory entry for an agent.
   * @param sessionId - The session ID.
   * @param agentId - The agent ID.
   * @param content - The content of the memory.
   * @param metadata - Optional metadata.
   * @param ttlSeconds - Time-to-live in seconds.
   * @returns The created memory entry.
   */
  async addMemory(
    sessionId: string,
    agentId: string,
    content: string,
    metadata: { [key: string]: string } = {},
    ttlSeconds?: number
  ): Promise<{ success: boolean; message: string; entry: MemoryEntry }> {
    this.checkConnected();
    return this.client!.addMemory(
      sessionId,
      agentId,
      content,
      metadata,
      ttlSeconds
    );
  }

  /**
   * Retrieves memories for a session.
   * @param sessionId - The session ID.
   * @param limit - Maximum number of memories.
   * @param after - Timestamp or ID to start after.
   * @param filter - Metadata filter.
   * @returns An array of memory entries.
   */
  async getMemory(
    sessionId: string,
    limit: number = 50,
    after: number | Long = 0,
    filter: { [key: string]: string } = {}
  ): Promise<MemoryEntry[]> {
    this.checkConnected();
    return this.client!.getMemory(sessionId, limit, after, filter);
  }

  /**
   * Clears all memories for a session.
   * @param sessionId - The session ID.
   * @returns Success status.
   */
  async clearMemory(
    sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    this.checkConnected();
    return this.client!.clearMemory(sessionId);
  }

  /**
   * Watches for changes in memory for a session.
   * @param sessionId - The session ID.
   * @returns An async iterable of changes.
   */
  async *watchMemory(sessionId: string): AsyncIterable<any> {
    this.checkConnected();
    yield* this.client!.watchMemory(sessionId);
  }

  /**
   * Adds an edge between two nodes in the graph.
   * @param fromNode - Source node ID.
   * @param toNode - Target node ID.
   * @param relation - The type of relation.
   * @param weight - Edge weight (default: 1.0).
   * @returns True if successful.
   */
  async addEdge(
    fromNode: Long | number | string,
    toNode: Long | number | string,
    relation: string,
    weight: number = 1.0
  ): Promise<boolean> {
    this.checkConnected();
    return this.client!.addEdge(fromNode, toNode, relation, weight);
  }

  /**
   * Gets neighboring nodes.
   * @param nodeId - The node ID.
   * @param relation - Optional relation type to filter by.
   * @returns An array of neighbor node IDs.
   */
  async getNeighbors(
    nodeId: Long | number | string,
    relation?: string
  ): Promise<Long[]> {
    this.checkConnected();
    return this.client!.getNeighbors(nodeId, relation);
  }

  /**
   * Traverses the graph from a start node.
   * @param startNode - The starting node ID.
   * @param maxDepth - Maximum depth to traverse (default: 1).
   * @returns An array of visited node IDs.
   */
  async traverse(
    startNode: Long | number | string,
    maxDepth: number = 1
  ): Promise<Long[]> {
    this.checkConnected();
    return this.client!.traverse(startNode, maxDepth);
  }

  /**
   * Samples random nodes from the graph.
   * @param limit - Number of nodes to sample.
   * @returns Sampled nodes.
   */
  async sampleGraph(limit: number = 100): Promise<any> {
    this.checkConnected();
    return this.client!.sampleGraph(limit);
  }

  /**
   * Subscribes to real-time updates.
   * @param filterType - "all", "node", "query".
   * @param nodeId - Specific node ID to watch.
   * @param queryText - Query text to watch for similar items.
   * @param threshold - Similarity threshold.
   * @returns An async iterable of updates.
   */
  async *subscribe(
    filterType: string = "all",
    nodeId?: Long | number | string,
    queryText: string = "",
    threshold: number = 0.8
  ): AsyncIterable<any> {
    this.checkConnected();
    yield* this.client!.subscribe(filterType, nodeId, queryText, threshold);
  }

  /**
   * Inserts multiple documents in a batch.
   * @param documents - Array of documents.
   * @param userId - User ID.
   * @returns Count of inserted items and their node IDs.
   */
  async batchInsert(
    documents: any[],
    userId: Long | number | string = 1
  ): Promise<{ count: number; nodeIds: Long[] }> {
    this.checkConnected();
    return this.client!.batchInsert(documents, userId);
  }

  /**
   * Grants permissions on a node to a user.
   * @param nodeId - Node ID.
   * @param userId - User ID.
   * @param permissions - Permissions object ({ read, write, delete }).
   * @returns True if successful.
   */
  async grantPermission(
    nodeId: Long | number | string,
    userId: Long | number | string,
    permissions: { read?: boolean; write?: boolean; delete?: boolean }
  ): Promise<boolean> {
    this.checkConnected();
    return this.client!.grantPermission(nodeId, userId, permissions);
  }

  /**
   * Revokes all permissions on a node for a user.
   * @param nodeId - Node ID.
   * @param userId - User ID.
   * @returns True if successful.
   */
  async revokePermission(
    nodeId: Long | number | string,
    userId: Long | number | string
  ): Promise<boolean> {
    this.checkConnected();
    return this.client!.revokePermission(nodeId, userId);
  }

  /**
   * Checks if a user has a specific permission on a node.
   * @param nodeId - Node ID.
   * @param userId - User ID.
   * @param permissionType - "read", "write", "delete".
   * @returns True if allowed.
   */
  async checkPermission(
    nodeId: Long | number | string,
    userId: Long | number | string,
    permissionType: string
  ): Promise<boolean> {
    this.checkConnected();
    return this.client!.checkPermission(nodeId, userId, permissionType);
  }

  /**
   * Grants permissions in batch.
   * @param grants - Array of grant objects.
   * @returns Detailed results of the operation.
   */
  async batchGrant(
    grants: Array<{
      nodeId: Long | number | string;
      userId: Long | number | string;
      permissions: { read?: boolean; write?: boolean; delete?: boolean };
    }>
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: any[];
    errors: any[];
  }> {
    this.checkConnected();
    return this.client!.batchGrant(grants);
  }

  /**
   * Inserts a node with ACL permissions in one go.
   * @param nodeId - Node ID.
   * @param text - Content.
   * @param metadata - Metadata.
   * @param userPermissions - Array of user permissions.
   * @returns Insertion result.
   */
  async insertWithAcl(
    nodeId: Long | number | string,
    text: string,
    metadata: any,
    userPermissions: Array<{
      userId: Long | number | string;
      permissions: { read?: boolean; write?: boolean; delete?: boolean };
    }>
  ): Promise<InsertResult> {
    this.checkConnected();
    return this.client!.insertWithAcl(nodeId, text, metadata, userPermissions);
  }

  // Helper to convert inputs to Long
  protected toLong(val: Long | number | string): Long {
    return Long.fromValue(val);
  }
}
