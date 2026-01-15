# Rice Node SDK Examples

This directory contains examples for using the Rice Node SDK.

## Setup

1. Build the SDK:

   ```bash
   cd ..
   npm run build
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and adjust values if needed.
   ```bash
   cp .env.example .env
   ```

## Basic State Example

This example demonstrates connection to the State (AI Memory) service, managing context (Focus), committing traces, and recalling memories.

Run the example:

```bash
# Using ts-node (install globally or use npx)
npx ts-node basic_state.ts
```

Ensure your State/Slate service is running at the configured address (default: `localhost:50051`).
