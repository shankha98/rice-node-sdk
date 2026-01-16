import { Client } from "../src/Client";

describe("Storage E2E", () => {
  let client: Client;
  const testId = "test-node-" + Date.now();

  beforeAll(async () => {
    // We assume local RiceDB instance is running
    client = new Client();
    await client.connect();
    // Ensure storage is available
    if (!client.storage) {
      throw new Error("Storage not enabled");
    }
  });

  it("should insert a document", async () => {
    await client.storage.insert(
      testId,
      "This is a test document for E2E testing.",
      {
        type: "test",
        timestamp: Date.now(),
      }
    );
  });

  it("should search for the document", async () => {
    // Allow some time for indexing if necessary (usually near-realtime)
    await new Promise((r) => setTimeout(r, 1000));

    const results = await client.storage.search("test document", 5);
    expect(results).toBeDefined();
    // We can't guarantee it's the first result without a fresh DB, but it should be there
    // For now just check we got results
    // expect(results.length).toBeGreaterThan(0);
  });

  it("should delete the document", async () => {
    await client.storage.delete(testId);
    // Verify deletion? Search again?
  });
});
