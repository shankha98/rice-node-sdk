import { Client } from "../src/Client";
import { StateClient } from "../src/state";
import { HttpClient } from "../src/storage/client/HttpClient";
import { RiceDBClient } from "../src/storage/client/RiceDBClient";

describe("Run ID Isolation Wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards default storage runId to insert/search", async () => {
    const storage = new RiceDBClient(
      "localhost",
      "http",
      50051,
      3000,
      undefined,
      "storage-run-a",
    );

    await storage.connect();
    await storage.insert(101, "doc-a", { source: "test" });
    await storage.search("doc-a", 1);

    const httpCtor = HttpClient as unknown as jest.Mock;
    const httpInstance =
      httpCtor.mock.results[httpCtor.mock.results.length - 1].value;

    expect(httpInstance.insert).toHaveBeenCalledWith(
      101,
      "doc-a",
      { source: "test" },
      1,
      undefined,
      undefined,
      "storage-run-a",
    );
    expect(httpInstance.search).toHaveBeenCalledWith(
      "doc-a",
      1,
      10,
      undefined,
      undefined,
      undefined,
      "storage-run-a",
    );
  });

  it("allows per-call runId override for storage operations", async () => {
    const storage = new RiceDBClient(
      "localhost",
      "http",
      50051,
      3000,
      undefined,
      "storage-run-default",
    );

    await storage.connect();
    await storage.insert(
      102,
      "doc-b",
      { source: "test" },
      1,
      undefined,
      undefined,
      "storage-run-override",
    );
    await storage.search(
      "doc-b",
      1,
      10,
      undefined,
      undefined,
      undefined,
      "storage-run-override",
    );
    await storage.deleteRun("storage-run-override");

    const httpCtor = HttpClient as unknown as jest.Mock;
    const httpInstance =
      httpCtor.mock.results[httpCtor.mock.results.length - 1].value;

    expect(httpInstance.insert).toHaveBeenCalledWith(
      102,
      "doc-b",
      { source: "test" },
      1,
      undefined,
      undefined,
      "storage-run-override",
    );
    expect(httpInstance.search).toHaveBeenCalledWith(
      "doc-b",
      1,
      10,
      undefined,
      undefined,
      undefined,
      "storage-run-override",
    );
    expect(httpInstance.deleteRun).toHaveBeenCalledWith("storage-run-override");
  });

  it("supports split stateRunId and storageRunId in unified Client", async () => {
    const client = new Client({
      stateRunId: "state-run-x",
      storageRunId: "storage-run-x",
    });
    await client.connect();

    await client.state.focus("state isolate");
    await client.storage.insert(103, "storage isolate", { source: "test" });

    const stateCtor = StateClient as unknown as jest.Mock;
    expect(stateCtor).toHaveBeenCalledWith(
      expect.any(String),
      undefined,
      "state-run-x",
    );

    const httpCtor = HttpClient as unknown as jest.Mock;
    const httpInstance =
      httpCtor.mock.results[httpCtor.mock.results.length - 1].value;
    expect(httpInstance.insert).toHaveBeenCalledWith(
      103,
      "storage isolate",
      { source: "test" },
      1,
      undefined,
      undefined,
      "storage-run-x",
    );
  });
});
