import { MongoClient } from "mongodb";

jest.mock("mongodb", () => ({ MongoClient: jest.fn() }));

const testCurrencies = {
  USD: { code: "USD", value: 1 },
  UAH: { code: "UAH", value: 40 },
  RUB: { code: "RUB", value: 90 },
  BYN: { code: "BYN", value: 120 },
};
const previousDocument = {
  _id: "synthetic-document-id",
  data: { UAH: { code: "UAH", value: 39 } },
};

describe("MongoDB persistence error handling", () => {
  const originalUri = process.env.MONGODB_URI;
  let sendCurrenciesToMongoDB;
  let client;
  let currenciesCollection;
  let diffCollection;
  let errorLog;

  beforeAll(() => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/synthetic-test-db";
    ({ sendCurrenciesToMongoDB } = jest.requireActual(
      "../api/mongoHandler.js",
    ));
  });

  afterAll(() => {
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  });

  beforeEach(() => {
    jest.resetAllMocks();
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    currenciesCollection = {
      findOne: jest.fn().mockResolvedValue(previousDocument),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    diffCollection = {
      replaceOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    client = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      db: jest.fn().mockReturnValue({
        collection: jest.fn((name) =>
          name === "currencies" ? currenciesCollection : diffCollection,
        ),
      }),
    };
    MongoClient.mockImplementation(() => client);
  });

  afterEach(() => {
    errorLog.mockRestore();
  });

  test("preserves the snapshot, filtering and successful update behavior", async () => {
    await expect(
      sendCurrenciesToMongoDB(testCurrencies),
    ).resolves.toBeUndefined();

    expect(diffCollection.replaceOne).toHaveBeenCalledWith(
      {},
      { data: previousDocument, lastUpdated: expect.any(Date) },
      { upsert: true },
    );
    expect(currenciesCollection.updateOne).toHaveBeenCalledWith(
      {},
      {
        $set: {
          data: { USD: testCurrencies.USD, UAH: testCurrencies.UAH },
          lastUpdated: expect.any(Date),
        },
      },
      { upsert: true },
    );
    expect(diffCollection.replaceOne.mock.invocationCallOrder[0]).toBeLessThan(
      currenciesCollection.updateOne.mock.invocationCallOrder[0],
    );
    expect(diffCollection.replaceOne.mock.calls[0][1].lastUpdated).toBe(
      currenciesCollection.updateOne.mock.calls[0][1].$set.lastUpdated,
    );
    expect(testCurrencies.RUB).toEqual({ code: "RUB", value: 90 });
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(errorLog).not.toHaveBeenCalled();
  });

  test.each([
    ["connect", 0, 0, 0],
    ["findOne", 1, 0, 0],
    ["replaceOne", 1, 1, 0],
    ["updateOne", 1, 1, 1],
  ])(
    "propagates %s failures, stops later writes and attempts cleanup",
    async (stage, reads, snapshots, updates) => {
      const failure = new Error(`Synthetic ${stage} failure`);
      const operations = {
        connect: client.connect,
        findOne: currenciesCollection.findOne,
        replaceOne: diffCollection.replaceOne,
        updateOne: currenciesCollection.updateOne,
      };
      operations[stage].mockRejectedValue(failure);

      await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(
        failure,
      );

      expect(currenciesCollection.findOne).toHaveBeenCalledTimes(reads);
      expect(diffCollection.replaceOne).toHaveBeenCalledTimes(snapshots);
      expect(currenciesCollection.updateOne).toHaveBeenCalledTimes(updates);
      expect(client.close).toHaveBeenCalledTimes(1);
      expect(errorLog).not.toHaveBeenCalled();
    },
  );

  test.each(["connect", "findOne", "replaceOne", "updateOne"])(
    "preserves the original %s error when cleanup also fails",
    async (stage) => {
      const failure = new Error(`Synthetic ${stage} failure`);
      const cleanupFailure = new Error("Synthetic cleanup failure");
      const operations = {
        connect: client.connect,
        findOne: currenciesCollection.findOne,
        replaceOne: diffCollection.replaceOne,
        updateOne: currenciesCollection.updateOne,
      };
      operations[stage].mockRejectedValue(failure);
      client.close.mockRejectedValue(cleanupFailure);

      await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(
        failure,
      );

      expect(client.close).toHaveBeenCalledTimes(1);
      expect(errorLog).toHaveBeenCalledWith(
        "Error closing MongoDB connection after a failed operation",
      );
    },
  );

  test("propagates cleanup failure after successful writes", async () => {
    const failure = new Error("Synthetic cleanup failure");
    client.close.mockRejectedValue(failure);

    await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(failure);

    expect(currenciesCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
  });

  test("propagates client construction failure before any operation", async () => {
    const failure = new Error("Synthetic client configuration failure");
    MongoClient.mockImplementation(() => {
      throw failure;
    });

    await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(failure);

    expect(client.connect).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
    expect(currenciesCollection.updateOne).not.toHaveBeenCalled();
  });
});
