# Rice Node SDK

Unified Node.js/TypeScript SDK for RiceDB (Persistent Semantic Database) and State (AI Memory).

## Installation

```bash
npm install rice-node-sdk
```

## Quick Start

The SDK provides a unified `Client` to access both Storage and State services.

```typescript
import { Client } from "rice-node-sdk";

// Initialize client (loads config from rice.config.js and .env)
const client = new Client();
await client.connect();

// --- Storage (RiceDB) ---
// Insert data
await client.storage.insert(
  "unique-node-id",
  "This is a piece of information stored in RiceDB.",
  { category: "example", value: 123 }
);

// Search for similar data
const results = await client.storage.search("information stored", 1, 5);
console.log(results);

// --- State (AI Memory) ---
// Focus on a context/task
await client.state.focus("User is asking about weather");

// Store a long-term memory (commit)
await client.state.commit(
  "The user prefers metric units for temperature.",
  "User preference noted.",
  {
    source: "conversation",
  }
);

// Recall relevant memories
const memories = await client.state.reminisce("weather preferences");
console.log(memories);
```

## Configuration

The SDK loads configuration from `rice.config.js` (or `.ts`/`.mjs`), environment variables, and constructor options.

### 1. Configuration File (`rice.config.js`)

Control which services are enabled. Useful for applications that only need Storage or only need State.

```javascript
/** @type {import('rice-node-sdk').RiceConfig} */
module.exports = {
  // Enable/Disable Storage (RiceDB)
  storage: {
    enabled: true, // Set to false if you only use State
  },
  // Enable/Disable State (Memory)
  state: {
    enabled: true, // Set to false if you only use Storage
  },
};
```

### 2. Environment Variables (`.env`)

Configure connection details and authentication.

```bash
# --- Storage (RiceDB) ---
# URL of your RiceDB instance (default: localhost:50051)
STORAGE_INSTANCE_URL=localhost:50051
# Auth token (if enabled on server)
STORAGE_AUTH_TOKEN=my-secret-token
# User for auto-login (default: admin)
STORAGE_USER=admin

# --- State (Memory) ---
# URL of your State instance
STATE_INSTANCE_URL=localhost:50051
# Auth token
STATE_AUTH_TOKEN=my-secret-token
# Default Run ID for memory sessions (optional)
STATE_RUN_ID=default-run-id
```

### 3. Advanced Configuration

#### Custom Config Path

You can load a specific config file by passing the path to the `Client` constructor.

```typescript
const client = new Client({ configPath: "./config/prod.rice.config.js" });
```

#### Managing Run IDs (Multi-User/Multi-Agent)

For State memory, the `runId` determines the session or agent context. You can switch run IDs dynamically to manage memory for different users or agents.

```typescript
// Option A: Set globally in constructor
const client = new Client({ runId: "user-123-session" });

// Option B: Switch dynamically
client.state.setRunId("user-456-session");
await client.state.focus("New task for user 456");
```

## AI Tool Definitions

The SDK provides pre-built tool definitions tailored for popular LLM providers. These tools map directly to State memory operations.

### Available Imports

- `rice-node-sdk/tools/anthropic`
- `rice-node-sdk/tools/google`
- `rice-node-sdk/tools/openai`

### Example Usage (Anthropic)

```typescript
import { state as anthropicTools } from "rice-node-sdk/tools/anthropic";
import { executeTool } from "rice-node-sdk/tools/execute";
import { Client } from "rice-node-sdk";

const client = new Client();
await client.connect();

// 1. Pass tools to your LLM
const response = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  tools: anthropicTools,
  // ...
});

// 2. Execute tools invoked by the LLM
for (const toolUse of response.content.filter((c) => c.type === "tool_use")) {
  const result = await executeTool(client.state, toolUse.name, toolUse.input);
  console.log("Tool result:", result);
}
```

### Example Usage (OpenAI)

```typescript
import { state as openaiTools } from "rice-node-sdk/tools/openai";
import { executeTool } from "rice-node-sdk/tools/execute";
import { Client } from "rice-node-sdk";

const client = new Client();
await client.connect();

// 1. Pass tools to OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    /* ... */
  ],
  tools: openaiTools, // Tools are already in OpenAI format
});

// 2. Execute tools
const toolCalls = response.choices[0].message.tool_calls;
if (toolCalls) {
  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await executeTool(
      client.state,
      toolCall.function.name,
      args
    );
    console.log("Tool result:", result);
  }
}
```

### Example Usage (Google Gemini)

```typescript
import { state as googleTools } from "rice-node-sdk/tools/google";
import { executeTool } from "rice-node-sdk/tools/execute";
import { Client } from "rice-node-sdk";

const client = new Client();
await client.connect();

// 1. Pass tools to Gemini
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  tools: [{ functionDeclarations: googleTools }],
});

// 2. Execute tools
const chat = model.startChat();
const result = await chat.sendMessage("Remember that I like pizza.");
const call = result.response.functionCalls()?.[0];

if (call) {
  const result = await executeTool(client.state, call.name, call.args);
  console.log("Tool result:", result);
}
```

### Tools Included

| Tool       | Purpose                                          | SDK Method                 |
| ---------- | ------------------------------------------------ | -------------------------- |
| `focus`    | Store information in short-term working memory   | `client.state.focus()`     |
| `remember` | Store information in long-term persistent memory | `client.state.commit()`    |
| `recall`   | Retrieve relevant memories from long-term memory | `client.state.reminisce()` |

> **Note**: The `remember` tool provided to LLMs maps to the `commit` method in the SDK.

## API Reference

### Client

```typescript
class Client {
  constructor(options?: { configPath?: string; runId?: string });
  async connect(): Promise<void>;
  get storage(): RiceDBClient;
  get state(): StateClient;
}
```

### Storage (RiceDB)

```typescript
interface RiceDBClient {
  insert(id: string, text: string, metadata?: object): Promise<void>;
  search(
    query: string,
    limit?: number,
    offset?: number
  ): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
  // ... graph operations
}
```

### State (Memory)

```typescript
interface StateClient {
  focus(content: string): Promise<void>;
  commit(input: string, output: string, metadata?: object): Promise<void>;
  reminisce(query: string): Promise<string[]>;
  setRunId(runId: string): void;
}
```

## License

ISC
