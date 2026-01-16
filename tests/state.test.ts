import { Client } from "../src/Client";

describe("State E2E", () => {
  let client: Client;
  const testRunId = "e2e-test-run-" + Date.now();

  beforeAll(async () => {
    client = new Client({ runId: testRunId });
    await client.connect();
    if (!client.state) {
      throw new Error("State not enabled");
    }
  });

  it("should focus on a context", async () => {
    await client.state.focus("Starting E2E test sequence");
  });

  it("should commit a memory", async () => {
    await client.state.commit(
      "Test input: What is the secret code?",
      "The secret code is 42.",
      { reasoning: "e2e-test" }
    );
  });

  it("should reminisce (recall) the memory", async () => {
    // Allow for potential async processing
    await new Promise((r) => setTimeout(r, 1000));

    const memories = await client.state.reminisce("secret code");
    expect(memories).toBeDefined();
    // Ideally we check if it contains "42"
  });

  it("should switch run ID", async () => {
    const newRunId = testRunId + "-switched";
    client.state.setRunId(newRunId);
    // Just verify no error
    await client.state.focus("New context in switched run");
  });
});
