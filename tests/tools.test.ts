import { Client } from "../src/Client";
import { execute } from "../src/tools/execute";

describe("Tool Execution E2E", () => {
  let client: Client;
  const testRunId = "e2e-tool-test-" + Date.now();

  beforeAll(async () => {
    client = new Client({ runId: testRunId });
    await client.connect();
  });

  it("should execute 'focus' tool", async () => {
    // We can spy on the client method if we want to verify call,
    // or just execute and assume no error = success
    const result = await execute(
      "focus",
      {
        content: "Focusing via tool execution",
      },
      client.state
    );
    expect(result).toBeDefined();
  });

  it("should execute 'remember' tool (maps to commit)", async () => {
    const result = await execute(
      "remember",
      {
        content: "Remembering this via tool",
      },
      client.state
    );
    expect(result).toBeDefined();
  });

  it("should execute 'recall' tool (maps to reminisce)", async () => {
    // First ensure there is something to recall
    await new Promise((r) => setTimeout(r, 1000));

    const result = await execute(
      "recall",
      {
        query: "via tool",
      },
      client.state
    );
    expect(result).toBeDefined();
    // Should be an array
    expect(Array.isArray(result)).toBe(true);
  });
});
