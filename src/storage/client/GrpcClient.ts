import { credentials, Metadata, ClientReadableStream } from "@grpc/grpc-js";
import {
  BaseRiceDBClient,
  HealthInfo,
  InsertResult,
  SearchResultItem,
  MemoryEntry,
} from "./BaseClient";
import {
  RiceDBClient as ProtoClient,
  BitVector as ProtoBitVector,
} from "../proto/ricedb";
import Long from "long";
import { BitVector } from "../utils/BitVector";

export class GrpcClient extends BaseRiceDBClient {
  private client: ProtoClient | null = null;
  private token: string | null = null;

  constructor(
    host: string = "localhost",
    port: number = 50051,
    token?: string
  ) {
    super(host, port);
    if (token) {
      this.token = token;
    }
  }

  async connect(): Promise<boolean> {
    const address = `${this.host}:${this.port}`;
    this.client = new ProtoClient(address, credentials.createInsecure(), {
      "grpc.max_send_message_length": 50 * 1024 * 1024,
      "grpc.max_receive_message_length": 50 * 1024 * 1024,
    });

    try {
      await this.health();
      this.connected = true;
      return true;
    } catch (e) {
      this.connected = false;
      throw e;
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.connected = false;
  }

  private getMetadata(): Metadata {
    const metadata = new Metadata();
    if (this.token) {
      metadata.add("authorization", `Bearer ${this.token}`);
    }
    return metadata;
  }

  private promisify<TReq, TRes>(method: Function, req: TReq): Promise<TRes> {
    return new Promise((resolve, reject) => {
      if (!this.client) return reject(new Error("Not connected"));
      method.call(
        this.client,
        req,
        this.getMetadata(),
        (err: any, res: TRes) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });
  }

  async health(): Promise<HealthInfo> {
    if (!this.client) throw new Error("Not connected");
    const res = await this.promisify(this.client.health, {});
    return res as HealthInfo;
  }

  async login(username: string, password: string): Promise<string> {
    if (!this.client) throw new Error("Not connected");
    const res = await this.promisify(this.client.login, { username, password });
    this.token = (res as any).token;
    return this.token!;
  }

  async createUser(
    username: string,
    password: string,
    role: string = "user"
  ): Promise<Long> {
    if (!this.client) throw new Error("Not connected");
    const res = await this.promisify(this.client.createUser, {
      username,
      password,
      role,
    });
    return (res as any).userId;
  }

  async deleteUser(username: string): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const res = await this.promisify(this.client.deleteUser, { username });
    return (res as any).success;
  }

  async getUser(username: string): Promise<any> {
    throw new Error("Get user is not supported via gRPC transport. Use HTTP.");
  }

  async listUsers(): Promise<any[]> {
    throw new Error(
      "List users is not supported via gRPC transport. Use HTTP."
    );
  }

  async insert(
    nodeId: Long | number | string,
    text: string,
    metadata: any,
    userId: Long | number | string = 1,
    sessionId?: string,
    embedding?: number[]
  ): Promise<InsertResult> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      id: this.toLong(nodeId),
      text,
      metadata: Buffer.from(JSON.stringify(metadata)),
      userId: this.toLong(userId),
      sessionId,
      embedding: embedding || [],
    };
    const res = await this.promisify(this.client.insert, req);
    return res as InsertResult;
  }

  async search(
    query: string,
    userId: Long | number | string,
    k: number = 10,
    sessionId?: string,
    filter?: { [key: string]: any },
    queryEmbedding?: number[]
  ): Promise<SearchResultItem[]> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      queryText: query,
      userId: this.toLong(userId),
      k,
      sessionId,
      filter: filter ? JSON.stringify(filter) : "",
      queryEmbedding: queryEmbedding || [],
    };
    const res: any = await this.promisify(this.client.search, req);
    return res.results.map((r: any) => ({
      id: r.id,
      similarity: r.similarity,
      metadata: JSON.parse(r.metadata.toString()),
    }));
  }

  async delete(
    nodeId: Long | number | string,
    sessionId?: string
  ): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.deleteNode, {
      nodeId: this.toLong(nodeId),
      sessionId,
    });
    return res.success;
  }

  async createSession(parentSessionId?: string): Promise<string> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.createSession, {
      parentSessionId,
    });
    return res.sessionId;
  }

  async snapshotSession(sessionId: string, path: string): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.snapshotSession, {
      sessionId,
      path,
    });
    return res.success;
  }

  async loadSession(path: string): Promise<string> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.loadSession, { path });
    return res.sessionId;
  }

  async commitSession(
    sessionId: string,
    mergeStrategy: string = "overwrite"
  ): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.commitSession, {
      sessionId,
      mergeStrategy,
    });
    return res.success;
  }

  async dropSession(sessionId: string): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.dropSession, {
      sessionId,
    });
    return res.success;
  }

  async writeMemory(
    address: BitVector,
    data: BitVector,
    userId: Long | number | string = 1
  ): Promise<{ success: boolean; message: string }> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      address: { chunks: address.toList() },
      data: { chunks: data.toList() },
      userId: this.toLong(userId),
    };
    const res: any = await this.promisify(this.client.writeMemory, req);
    return { success: res.success, message: res.message };
  }

  async readMemory(
    address: BitVector,
    userId: Long | number | string = 1
  ): Promise<BitVector> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      address: { chunks: address.toList() },
      userId: this.toLong(userId),
    };
    const res: any = await this.promisify(this.client.readMemory, req);
    return new BitVector(res.data.chunks);
  }

  async addMemory(
    sessionId: string,
    agentId: string,
    content: string,
    metadata: { [key: string]: string } = {},
    ttlSeconds?: number
  ): Promise<{ success: boolean; message: string; entry: MemoryEntry }> {
    if (!this.client) throw new Error("Not connected");
    const req = { sessionId, agentId, content, metadata, ttlSeconds };
    const res: any = await this.promisify(this.client.addMemory, req);
    return { success: res.success, message: res.message, entry: res.entry };
  }

  async getMemory(
    sessionId: string,
    limit: number = 50,
    after: number | Long = 0,
    filter: { [key: string]: string } = {}
  ): Promise<MemoryEntry[]> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      sessionId,
      limit,
      afterTimestamp: Long.fromValue(after),
      filter,
    };
    const res: any = await this.promisify(this.client.getMemory, req);
    return res.entries;
  }

  async clearMemory(
    sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.client) throw new Error("Not connected");
    const res: any = await this.promisify(this.client.clearMemory, {
      sessionId,
    });
    return { success: res.success, message: res.message };
  }

  async *watchMemory(sessionId: string): AsyncIterable<any> {
    if (!this.client) throw new Error("Not connected");
    const stream = this.client.watchMemory({ sessionId }, this.getMetadata());

    for await (const event of stream) {
      yield event;
    }
  }

  async addEdge(
    fromNode: Long | number | string,
    toNode: Long | number | string,
    relation: string,
    weight: number = 1.0
  ): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      from: this.toLong(fromNode),
      to: this.toLong(toNode),
      relation,
      weight,
    };
    const res: any = await this.promisify(this.client.addEdge, req);
    return res.success;
  }

  async getNeighbors(
    nodeId: Long | number | string,
    relation?: string
  ): Promise<Long[]> {
    if (!this.client) throw new Error("Not connected");
    const req = { nodeId: this.toLong(nodeId), relation };
    const res: any = await this.promisify(this.client.getNeighbors, req);
    return res.neighbors;
  }

  async traverse(
    startNode: Long | number | string,
    maxDepth: number = 1
  ): Promise<Long[]> {
    if (!this.client) throw new Error("Not connected");
    const req = { start: this.toLong(startNode), maxDepth };
    const res: any = await this.promisify(this.client.traverseGraph, req);
    return res.visited;
  }

  async sampleGraph(limit: number = 100): Promise<any> {
    throw new Error(
      "Sample graph is not supported via gRPC transport. Use HTTP."
    );
  }

  async *subscribe(
    filterType: string = "all",
    nodeId?: Long | number | string,
    queryText: string = "",
    threshold: number = 0.8
  ): AsyncIterable<any> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      filterType,
      nodeId: nodeId ? this.toLong(nodeId) : undefined,
      vector: [],
      queryText,
      threshold,
    };
    const stream = this.client.subscribe(req, this.getMetadata());

    for await (const event of stream) {
      const res: any = { type: event.type, nodeId: event.nodeId };
      if (event.node) {
        res.node = {
          id: event.node.id,
          metadata: JSON.parse(event.node.metadata.toString()),
        };
      }
      yield res;
    }
  }

  async batchInsert(
    documents: any[],
    userId: Long | number | string = 1
  ): Promise<{ count: number; nodeIds: Long[] }> {
    if (!this.client) throw new Error("Not connected");

    return new Promise((resolve, reject) => {
      if (!this.client) return reject(new Error("Not connected"));
      const stream = this.client.batchInsert(
        this.getMetadata(),
        (err: any, res: any) => {
          if (err) reject(err);
          else resolve({ count: res.count, nodeIds: res.nodeIds });
        }
      );

      for (const doc of documents) {
        const docUserId =
          doc.userId !== undefined
            ? this.toLong(doc.userId)
            : this.toLong(userId);
        const text = doc.text || "";
        const metadata = Buffer.from(JSON.stringify(doc.metadata));

        stream.write({
          id: this.toLong(doc.id),
          text,
          metadata,
          userId: docUserId,
          sessionId: undefined,
        });
      }
      stream.end();
    });
  }

  async grantPermission(
    nodeId: Long | number | string,
    userId: Long | number | string,
    permissions: { read?: boolean; write?: boolean; delete?: boolean }
  ): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      nodeId: this.toLong(nodeId),
      targetUserId: this.toLong(userId),
      permissions: {
        read: permissions.read || false,
        write: permissions.write || false,
        delete: permissions.delete || false,
      },
    };
    const res: any = await this.promisify(this.client.grantPermission, req);
    return res.success;
  }

  async revokePermission(
    nodeId: Long | number | string,
    userId: Long | number | string
  ): Promise<boolean> {
    if (!this.client) throw new Error("Not connected");
    const req = {
      nodeId: this.toLong(nodeId),
      targetUserId: this.toLong(userId),
    };
    const res: any = await this.promisify(this.client.revokePermission, req);
    return res.success;
  }

  async checkPermission(
    nodeId: Long | number | string,
    userId: Long | number | string,
    permissionType: string
  ): Promise<boolean> {
    console.warn(
      `checkPermission not supported via gRPC, assuming false for ${nodeId}`
    );
    return false;
  }

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
    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < grants.length; i++) {
      const grant = grants[i];
      try {
        const success = await this.grantPermission(
          grant.nodeId,
          grant.userId,
          grant.permissions
        );
        results.push({
          index: i,
          nodeId: grant.nodeId,
          userId: grant.userId,
          success: true,
          result: success,
        });
      } catch (e: any) {
        errors.push({
          index: i,
          nodeId: grant.nodeId,
          userId: grant.userId,
          error: e.message || String(e),
        });
      }
    }

    return {
      total: grants.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async insertWithAcl(
    nodeId: Long | number | string,
    text: string,
    metadata: any,
    userPermissions: Array<{
      userId: Long | number | string;
      permissions: { read?: boolean; write?: boolean; delete?: boolean };
    }>
  ): Promise<InsertResult> {
    if (!userPermissions || userPermissions.length === 0) {
      throw new Error("At least one user permission must be provided");
    }

    const primaryUser = userPermissions[0];
    const primaryUserId = primaryUser.userId;

    // 1. Insert for primary user
    const insertRes = await this.insert(nodeId, text, metadata, primaryUserId);

    // 2. Grant permissions for others
    const additionalGrants = userPermissions.slice(1).map((p) => ({
      nodeId: nodeId,
      userId: p.userId,
      permissions: p.permissions,
    }));

    if (additionalGrants.length > 0) {
      const grantRes = await this.batchGrant(additionalGrants);
      insertRes.aclGrants = grantRes;
    }

    insertRes.aclUsers = userPermissions;
    return insertRes;
  }
}
