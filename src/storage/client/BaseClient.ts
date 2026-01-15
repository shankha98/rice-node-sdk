import { BitVector } from "../utils/BitVector";
import Long from "long";

export interface HealthInfo {
  status: string;
  version: string;
}

export interface InsertResult {
  success: boolean;
  nodeId: Long;
  message: string;
  aclGrants?: any;
  aclUsers?: any[];
}

export interface SearchResultItem {
  id: Long;
  similarity: number;
  metadata: any;
}

export interface MemoryEntry {
  id: string;
  sessionId: string;
  agentId: string;
  content: string;
  timestamp: Long;
  metadata: { [key: string]: string };
  expiresAt?: Long;
}

export abstract class BaseRiceDBClient {
  protected host: string;
  protected port: number;
  protected connected: boolean = false;

  constructor(host: string = "localhost", port: number = 3000) {
    this.host = host;
    this.port = port;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): void;
  abstract health(): Promise<HealthInfo>;

  abstract login(username: string, password: string): Promise<string>;
  abstract createUser(
    username: string,
    password: string,
    role?: string
  ): Promise<Long>;
  abstract deleteUser(username: string): Promise<boolean>;
  abstract getUser(username: string): Promise<any>;
  abstract listUsers(): Promise<any[]>;

  abstract insert(
    nodeId: Long | number | string,
    text: string,
    metadata: any,
    userId?: Long | number | string,
    sessionId?: string,
    embedding?: number[]
  ): Promise<InsertResult>;

  abstract search(
    query: string,
    userId: Long | number | string,
    k?: number,
    sessionId?: string,
    filter?: { [key: string]: any },
    queryEmbedding?: number[]
  ): Promise<SearchResultItem[]>;

  abstract delete(
    nodeId: Long | number | string,
    sessionId?: string
  ): Promise<boolean>;

  // Cortex Session
  abstract createSession(parentSessionId?: string): Promise<string>;
  abstract snapshotSession(sessionId: string, path: string): Promise<boolean>;
  abstract loadSession(path: string): Promise<string>;
  abstract commitSession(
    sessionId: string,
    mergeStrategy?: string
  ): Promise<boolean>;
  abstract dropSession(sessionId: string): Promise<boolean>;

  // SDM
  abstract writeMemory(
    address: BitVector,
    data: BitVector,
    userId?: Long | number | string
  ): Promise<{ success: boolean; message: string }>;
  abstract readMemory(
    address: BitVector,
    userId?: Long | number | string
  ): Promise<BitVector>;

  // Agent Memory
  abstract addMemory(
    sessionId: string,
    agentId: string,
    content: string,
    metadata?: { [key: string]: string },
    ttlSeconds?: number
  ): Promise<{ success: boolean; message: string; entry: MemoryEntry }>;

  abstract getMemory(
    sessionId: string,
    limit?: number,
    after?: number | Long,
    filter?: { [key: string]: string }
  ): Promise<MemoryEntry[]>;

  abstract clearMemory(
    sessionId: string
  ): Promise<{ success: boolean; message: string }>;
  abstract watchMemory(sessionId: string): AsyncIterable<any>;

  // Graph
  /**
   * Create a semantic link between two nodes.
   * Alias for addEdge.
   */
  async link(
    sourceId: Long | number | string,
    relation: string,
    targetId: Long | number | string,
    weight: number = 1.0
  ): Promise<boolean> {
    return this.addEdge(sourceId, targetId, relation, weight);
  }

  abstract addEdge(
    fromNode: Long | number | string,
    toNode: Long | number | string,
    relation: string,
    weight?: number
  ): Promise<boolean>;
  abstract getNeighbors(
    nodeId: Long | number | string,
    relation?: string
  ): Promise<Long[]>;
  abstract traverse(
    startNode: Long | number | string,
    maxDepth?: number
  ): Promise<Long[]>;
  abstract sampleGraph(limit?: number): Promise<any>;

  // PubSub
  abstract subscribe(
    filterType?: string,
    nodeId?: Long | number | string,
    queryText?: string,
    threshold?: number
  ): AsyncIterable<any>;

  abstract batchInsert(
    documents: any[],
    userId?: Long | number | string
  ): Promise<{ count: number; nodeIds: Long[] }>;

  /**
   * High-performance bulk ingestion using batches and concurrency.
   *
   * @param documents List of documents to insert
   * @param batchSize Number of documents per batch (default 500)
   * @param concurrency Number of concurrent requests (default 4)
   * @param userId User ID to own the documents
   */
  async fastIngest(
    documents: any[],
    batchSize: number = 500,
    concurrency: number = 4,
    userId?: Long | number | string
  ): Promise<{
    totalInserted: number;
    failedBatches: number;
    errors: string[];
    timeTaken: number;
    throughput: number;
  }> {
    const startTime = Date.now();
    let totalInserted = 0;
    let failedBatches = 0;
    const errors: string[] = [];

    // Create chunks
    const chunks: any[][] = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      chunks.push(documents.slice(i, i + batchSize));
    }

    // Process with concurrency
    const queue = [...chunks];
    const processChunk = async (chunk: any[]) => {
      try {
        const result = await this.batchInsert(chunk, userId);
        totalInserted += result.count;
      } catch (e: any) {
        failedBatches++;
        if (errors.length < 10) {
          errors.push(e.message || String(e));
        }
      }
    };

    const workers = Array(Math.min(concurrency, chunks.length))
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const chunk = queue.shift();
          if (chunk) {
            await processChunk(chunk);
          }
        }
      });

    await Promise.all(workers);

    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    const throughput = timeTaken > 0 ? totalInserted / timeTaken : 0;

    return {
      totalInserted,
      failedBatches,
      errors,
      timeTaken,
      throughput,
    };
  }

  abstract grantPermission(
    nodeId: Long | number | string,
    userId: Long | number | string,
    permissions: { read?: boolean; write?: boolean; delete?: boolean }
  ): Promise<boolean>;
  abstract revokePermission(
    nodeId: Long | number | string,
    userId: Long | number | string
  ): Promise<boolean>;
  abstract checkPermission(
    nodeId: Long | number | string,
    userId: Long | number | string,
    permissionType: string
  ): Promise<boolean>;

  abstract batchGrant(
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
  }>;

  abstract insertWithAcl(
    nodeId: Long | number | string,
    text: string,
    metadata: any,
    userPermissions: Array<{
      userId: Long | number | string;
      permissions: { read?: boolean; write?: boolean; delete?: boolean };
    }>
  ): Promise<InsertResult>;

  // Helper to convert inputs to Long
  protected toLong(val: Long | number | string): Long {
    return Long.fromValue(val);
  }
}
