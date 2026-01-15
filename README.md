# Rice Node SDK

Unified Node.js/TypeScript SDK for RiceDB (Persistent Semantic Database) and State (AI Memory).

## Installation

```bash
npm install rice-node-sdk
```

## Usage

The SDK exports two main clients: `storage` (RiceDB) and `state` (State).

### Importing

```typescript
import { storage, state } from "rice-node-sdk";
```

### Storage (RiceDB)

RiceDB is a high-performance vector database with graph capabilities.

```typescript
import { storage } from "rice-node-sdk";

// Initialize client (connects to localhost by default)
const db = new storage("localhost", "auto");
await db.connect();

// Insert a document
await db.insert(
  "unique-node-id",
  "This is a piece of information stored in RiceDB.",
  { category: "example", value: 123 }
);

// Search for similar documents
const results = await db.search("information stored", 1, 5);
console.log(results);

// Graph operations
await db.addEdge("node-1", "node-2", "related_to");
const neighbors = await db.getNeighbors("node-1");
```

### State (AI Memory)

State is an AI memory system for managing agent interactions and context.

```typescript
import { state } from "rice-node-sdk";

// Initialize client
const memory = new state("localhost:50051");

// Focus on a context
const runId = await memory.focus("User is asking about weather");

// Commit an interaction trace
await memory.commit("What is the weather?", "It is sunny.", {
  action: "reply",
  agent_id: "weather-bot",
});

// Recall relevant memories
const memories = await memory.reminisce("weather conditions");
console.log(memories);
```

## Features

- **Unified Interface**: Access both storage and memory systems from a single package.
- **TypeScript Support**: Full type definitions included.
- **Dual Transport**: RiceDB client supports both gRPC and HTTP with auto-switching.
- **Developer Experience**: simplified APIs and extensive JSDoc comments.

## Configuration

### Storage Client

```typescript
new storage(host: string, transport: 'grpc'|'http'|'auto', grpcPort: number, httpPort: number)
```

### State Client

```typescript
new state(address: string, token?: string, runId?: string)
```

## License

ISC
