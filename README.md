# Rice Node SDK

Node.js/TypeScript SDK for Rice

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

// --- Storage ---
// Insert data
await client.storage.insert(
  "unique-node-id",
  "This is a piece of information stored in Rice Storage.",
  { category: "example", value: 123 },
);

// Search for similar data
const results = await client.storage.search("information stored", 1, 5);
console.log(results);

// --- State (AI Agent Memory) ---
// Focus on a context/task
await client.state.focus("User is asking about weather");

// Store a long-term memory (commit)
await client.state.commit(
  "The user prefers metric units for temperature.",
  "User preference noted.",
  { source: "conversation" },
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
  // Enable/Disable Storage
  storage: {
    enabled: true, // Set to false if you only use State
  },
  // Enable/Disable State (AI Agent Memory)
  state: {
    enabled: true, // Set to false if you only use Storage
  },
};
```

### 2. Environment Variables (`.env`)

Configure connection details and authentication.

```bash
# --- Storage ---
# URL of your Storage instance (default: localhost:50051)
STORAGE_INSTANCE_URL=localhost:50051
# Auth token (if enabled on server)
STORAGE_AUTH_TOKEN=my-secret-token
# User for auto-login (default: admin)
STORAGE_USER=admin

# --- State (AI Agent Memory) ---
# URL of your State instance
STATE_INSTANCE_URL=localhost:50051
# Auth token
STATE_AUTH_TOKEN=my-secret-token
# Default Run ID for memory sessions (optional)
STATE_RUN_ID=default-run-id

# --- LLM Providers (for examples) ---
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

### 3. Advanced Configuration

#### Custom Config Path

You can load a specific config file by passing the path to the `Client` constructor.

```typescript
const client = new Client({ configPath: "./config/prod.rice.config.js" });
```

#### Managing Run IDs (State Isolation Boundary)

For State memory, `runId` is the isolation boundary. Use one unique run ID per execution/session/test, perform all state operations with that run, then clean up with `deleteRun()`.

```typescript
const runId = `session-${Date.now()}`;
const client = new Client({ runId });
await client.connect();

await client.state.focus("working memory item");
await client.state.commit("input", "outcome");
await client.state.setVariable("k", { v: 1 });
await client.state.addGoal("Do X", "high");
await client.state.defineConcept("Profile", { type: "object" });

// cleanup this run
await client.state.deleteRun();
```

Practical rule: use `runId` for isolation. Do not emulate run isolation with metadata filters.

Reference examples:
- `examples/check_state_run_isolation.ts`
- `examples/check_state_all_memory_isolation.ts`

## State Features

The State service provides comprehensive AI agent memory and cognition capabilities.

### Core Memory Operations

```typescript
// Focus - Store in short-term working memory (Flux)
await client.state.focus("Current task context");

// Drift - Read current working memory items
const driftItems = await client.state.drift();

// Commit - Store in long-term episodic memory (Echoes)
await client.state.commit("User asked about weather", "Provided forecast", {
  action: "weather_lookup",
  agent_id: "assistant",
});

// Reminisce - Recall relevant memories
const memories = await client.state.reminisce("weather questions", 5);
```

### Working Memory (Structured Variables)

Store and manage structured state for your agent's reasoning process.

```typescript
// Set a variable (supports any JSON-serializable value)
await client.state.setVariable("user_name", "Alice", "explicit");
await client.state.setVariable(
  "session_context",
  {
    task: "code review",
    language: "TypeScript",
  },
  "system",
);

// Get a variable
const userVar = await client.state.getVariable("user_name");
console.log(userVar.value); // "Alice"

// List all variables
const allVars = await client.state.listVariables();

// Delete a variable
await client.state.deleteVariable("user_name");
```

Variable sources: `"system"`, `"reasoning"`, `"retrieval"`, `"perception"`, `"explicit"`

### Goals

Manage hierarchical goals for goal-directed agent behavior.

```typescript
// Add a goal
const mainGoal = await client.state.addGoal("Complete project", "high");

// Add a sub-goal (with parent)
const subGoal = await client.state.addGoal(
  "Review authentication module",
  "medium",
  mainGoal.id,
);

// List goals (optionally filter by status)
const allGoals = await client.state.listGoals();
const activeGoals = await client.state.listGoals("active");

// Update goal status
await client.state.updateGoal(subGoal.id, "achieved");
```

Goal priorities: `"low"`, `"medium"`, `"high"`, `"critical"`
Goal statuses: `"active"`, `"suspended"`, `"achieved"`, `"abandoned"`, `"failed"`

### Concepts (Schema Definitions)

Define structured concepts for Level 4 agency and semantic understanding.

```typescript
// Define a concept with JSON Schema
await client.state.defineConcept("Task", {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string", enum: ["pending", "in_progress", "completed"] },
    priority: { type: "number", minimum: 1, maximum: 5 },
  },
  required: ["id", "title", "status"],
});

// List defined concepts
const concepts = await client.state.listConcepts();
```

### Actions

Log and track agent actions for auditing and learning.

```typescript
// Submit an action
const result = await client.state.submitAction("agent-1", "reason", {
  thought: "Analyzing the code structure",
  conclusion: "Start with main entry point",
});

// Get action log
const actionLog = await client.state.getActionLog(100);

// Filter by action type
const reasonActions = await client.state.getActionLog(50, "reason");
```

Action types: `"reason"`, `"retrieve"`, `"learn"`, `"ground"`

### Decision Cycles

Run autonomous decision cycles with scored action candidates.

```typescript
// Run a decision cycle with candidates
const cycleResult = await client.state.runCycle("agent-1", [
  {
    actionType: "reason",
    action: { thought: "Should analyze data first" },
    score: 0.8,
    rationale: "Data analysis is foundational",
  },
  {
    actionType: "retrieve",
    action: { query: "relevant documentation" },
    score: 0.6,
    rationale: "Documentation might help",
  },
]);

console.log(cycleResult.selectedAction);
console.log(cycleResult.planningTimeMs);

// Get cycle history
const history = await client.state.getCycleHistory(10);
```

### Pub/Sub (Real-time Events)

Subscribe to real-time events from the State service, such as variable updates or memory commits. This is useful for multi-agent coordination.

```typescript
// Subscribe to variable updates
const stream = client.state.subscribe(["VariableUpdate"]);

stream.on("data", (event) => {
  console.log("Received event:", event.type);
  if (event.type === "VariableUpdate") {
    const variable = JSON.parse(event.payload);
    console.log(`Variable ${variable.name} updated to:`, variable.value_json);
  }
});

stream.on("error", (err) => console.error("Stream error:", err));
```

## AI Tool Definitions

The SDK provides pre-built tool definitions tailored for popular LLM providers. These tools map directly to State memory operations.

### Available Imports

- `rice-node-sdk/tools/anthropic` - Anthropic Claude format
- `rice-node-sdk/tools/google` - Google Gemini format
- `rice-node-sdk/tools/openai` - OpenAI function calling format
- `rice-node-sdk/tools/vercel` - Vercel AI SDK format (with bound execute functions)

### Example Usage (Vercel AI SDK)

The Vercel AI SDK tools come with execute functions pre-bound to your StateClient, making integration seamless.

```typescript
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { Client, statetool } from "rice-node-sdk";

const client = new Client({ runId: "my-agent-session" });
await client.connect();

// Create tools bound to your StateClient
const tools = statetool.createVercelTools(client.state);

// Use with generateText - tools are auto-executed!
const result = await generateText({
  model: google("gemini-2.0-flash"),
  tools,
  stopWhen: stepCountIs(5),
  system: `You are an assistant with persistent memory.
Use 'remember' to store facts and 'recall' to search memories.`,
  prompt: "Remember that I prefer Python for ML projects.",
});

console.log(result.text);
```

### Example Usage (Anthropic)

```typescript
import { state as anthropicTools } from "rice-node-sdk/tools/anthropic";
import { execute } from "rice-node-sdk/tools/execute";
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
  const result = await execute(toolUse.name, toolUse.input, client.state);
  console.log("Tool result:", result);
}
```

### Example Usage (OpenAI)

```typescript
import { state as openaiTools } from "rice-node-sdk/tools/openai";
import { execute } from "rice-node-sdk/tools/execute";
import { Client } from "rice-node-sdk";

const client = new Client();
await client.connect();

// 1. Pass tools to OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    /* ... */
  ],
  tools: openaiTools,
});

// 2. Execute tools
const toolCalls = response.choices[0].message.tool_calls;
if (toolCalls) {
  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await execute(toolCall.function.name, args, client.state);
    console.log("Tool result:", result);
  }
}
```

### Example Usage (Google Gemini)

```typescript
import { state as googleTools } from "rice-node-sdk/tools/google";
import { execute } from "rice-node-sdk/tools/execute";
import { Client } from "rice-node-sdk";

const client = new Client();
await client.connect();

// 1. Pass tools to Gemini
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{ functionDeclarations: googleTools }],
});

// 2. Execute tools
const chat = model.startChat();
const result = await chat.sendMessage("Remember that I like pizza.");
const call = result.response.functionCalls()?.[0];

if (call) {
  const result = await execute(call.name, call.args, client.state);
  console.log("Tool result:", result);
}
```

### Tools Included

| Tool              | Purpose                                          | SDK Method                       |
| ----------------- | ------------------------------------------------ | -------------------------------- |
| `focus`           | Store information in short-term working memory   | `client.state.focus()`           |
| `drift`           | Read current items from short-term memory        | `client.state.drift()`           |
| `remember`        | Store information in long-term persistent memory | `client.state.commit()`          |
| `recall`          | Retrieve relevant memories from long-term memory | `client.state.reminisce()`       |
| `trigger`         | Trigger a registered skill or procedure          | `client.state.trigger()`         |
| `setVariable`     | Set a structured variable in working memory      | `client.state.setVariable()`     |
| `getVariable`     | Get a structured variable from working memory    | `client.state.getVariable()`     |
| `listVariables`   | List all variables in working memory             | `client.state.listVariables()`   |
| `deleteVariable`  | Delete a variable from working memory            | `client.state.deleteVariable()`  |
| `defineConcept`   | Define a concept with JSON schema                | `client.state.defineConcept()`   |
| `listConcepts`    | List all defined concepts                        | `client.state.listConcepts()`    |
| `addGoal`         | Add a new goal to the agent's goal stack         | `client.state.addGoal()`         |
| `updateGoal`      | Update the status of an existing goal            | `client.state.updateGoal()`      |
| `listGoals`       | List all goals, optionally filtered by status    | `client.state.listGoals()`       |
| `submitAction`    | Submit an action for execution and logging       | `client.state.submitAction()`    |
| `getActionLog`    | Get the action log for the current run           | `client.state.getActionLog()`    |
| `runCycle`        | Run a decision cycle with action candidates      | `client.state.runCycle()`        |
| `getCycleHistory` | Get history of decision cycles                   | `client.state.getCycleHistory()` |
| `subscribe`       | Subscribe to real-time state events              | `client.state.subscribe()`       |

## API Reference

### Client

```typescript
class Client {
  constructor(options?: {
    configPath?: string;
    runId?: string;
    stateRunId?: string;
    storageRunId?: string;
  });
  async connect(): Promise<void>;
  get storage(): StorageClient;
  get state(): StateClient;
}
```

### Storage

```typescript
interface StorageClient {
  insert(id: string, text: string, metadata?: object): Promise<InsertResult>;
  search(
    query: string,
    limit?: number,
    offset?: number,
  ): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
  health(): Promise<string>;
  // ... additional graph operations
}
```

### State (AI Agent Memory)

```typescript
interface StateClient {
  // Core Memory
  focus(content: string): Promise<string>;
  drift(): Promise<any[]>;
  commit(
    input: string,
    output: string,
    options?: CommitOptions,
  ): Promise<boolean>;
  reminisce(query: string, limit?: number): Promise<any[]>;

  // Working Memory (Variables)
  setVariable(name: string, value: any, source?: string): Promise<boolean>;
  getVariable(name: string): Promise<Variable>;
  listVariables(): Promise<Variable[]>;
  deleteVariable(name: string): Promise<boolean>;

  // Concepts
  defineConcept(name: string, schema: object): Promise<boolean>;
  listConcepts(): Promise<Concept[]>;

  // Goals
  addGoal(
    description: string,
    priority?: string,
    parentId?: string,
  ): Promise<Goal>;
  updateGoal(goalId: string, status: string): Promise<boolean>;
  listGoals(statusFilter?: string): Promise<Goal[]>;

  // Actions
  submitAction(
    agentId: string,
    actionType: string,
    details: any,
  ): Promise<ActionResult>;
  getActionLog(
    limit?: number,
    actionTypeFilter?: string,
  ): Promise<ActionLogEntry[]>;

  // Decision Cycles
  runCycle(
    agentId: string,
    candidates?: ActionCandidate[],
  ): Promise<CycleResult>;
  getCycleHistory(limit?: number): Promise<CycleResult[]>;

  // Events
  subscribe(eventTypes?: string[]): NodeJS.EventEmitter;

  // Session Management
  setRunId(runId: string): void;

  deleteRun(): Promise<boolean>;

  // Skills
  trigger(skillName: string): Promise<number>;
}
```

## License

Proprietary. All Rights Reserved.
