// Mock GrpcClient to fail connection (testing fallback logic in RiceDBClient)
jest.mock("../src/storage/client/GrpcClient", () => {
  return {
    GrpcClient: jest.fn().mockImplementation(() => {
      return {
        connect: jest
          .fn()
          .mockRejectedValue(new Error("Mocked gRPC connection failure")),
        insert: jest.fn(),
        search: jest.fn(),
        deleteRun: jest.fn(),
      };
    }),
  };
});

// Mock HttpClient to succeed (used as fallback)
jest.mock("../src/storage/client/HttpClient", () => {
  return {
    HttpClient: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockResolvedValue(true),
        insert: jest.fn().mockResolvedValue({
          success: true,
          nodeId: { toString: () => "123" },
        }),
        search: jest
          .fn()
          .mockResolvedValue([
            { id: { toString: () => "123" }, similarity: 0.9 },
          ]),
        delete: jest.fn().mockResolvedValue(true),
        deleteRun: jest.fn().mockResolvedValue({
          success: true,
          message: "deleted",
          count: { toString: () => "1" },
        }),
      };
    }),
  };
});

// Mock StateClient
jest.mock("../src/state/index", () => {
  return {
    StateClient: jest.fn().mockImplementation(() => {
      return {
        setRunId: jest.fn(),
        focus: jest.fn().mockResolvedValue("mock-focus-id"),
        commit: jest.fn().mockResolvedValue(true),
        reminisce: jest
          .fn()
          .mockResolvedValue([
            { input: "test", outcome: "result", score: 0.9 },
          ]),
      };
    }),
  };
});
