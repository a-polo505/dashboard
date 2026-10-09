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
  let currentCursor;
  let previousCursor;
  let session;
  let transactionActive;
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
    transactionActive = false;
    session = {
      startTransaction: jest.fn(() => {
        transactionActive = true;
      }),
      commitTransaction: jest.fn(async () => {
        transactionActive = false;
      }),
      abortTransaction: jest.fn(async () => {
        transactionActive = false;
      }),
      inTransaction: jest.fn(() => transactionActive),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    currentCursor = {
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([previousDocument]),
    };
    previousCursor = {
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([{ _id: "synthetic-history-id" }]),
    };
    currenciesCollection = {
      find: jest.fn().mockReturnValue(currentCursor),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    diffCollection = {
      find: jest.fn().mockReturnValue(previousCursor),
      replaceOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    client = {
      connect: jest.fn().mockResolvedValue(undefined),
      startSession: jest.fn().mockReturnValue(session),
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
      { _id: "synthetic-history-id" },
      { data: previousDocument, lastUpdated: expect.any(Date) },
      { upsert: true, session },
    );
    expect(currenciesCollection.updateOne).toHaveBeenCalledWith(
      { _id: previousDocument._id },
      {
        $set: {
          data: { USD: testCurrencies.USD, UAH: testCurrencies.UAH },
          lastUpdated: expect.any(Date),
        },
      },
      { upsert: true, session },
    );
    expect(session.startTransaction).toHaveBeenCalledWith({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });
    expect(currenciesCollection.find).toHaveBeenCalledWith({}, { session });
    expect(diffCollection.find).toHaveBeenCalledWith({}, { session });
    expect(currentCursor.limit).toHaveBeenCalledWith(2);
    expect(previousCursor.limit).toHaveBeenCalledWith(2);
    expect(diffCollection.replaceOne.mock.invocationCallOrder[0]).toBeLessThan(
      currenciesCollection.updateOne.mock.invocationCallOrder[0],
    );
    expect(diffCollection.replaceOne.mock.calls[0][1].lastUpdated).toBe(
      currenciesCollection.updateOne.mock.calls[0][1].$set.lastUpdated,
    );
    expect(testCurrencies.RUB).toEqual({ code: "RUB", value: 90 });
    expect(testCurrencies.BYN).toEqual({ code: "BYN", value: 120 });
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(
      currenciesCollection.updateOne.mock.invocationCallOrder[0],
    ).toBeLessThan(session.commitTransaction.mock.invocationCallOrder[0]);
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(errorLog).not.toHaveBeenCalled();
  });

  test.each([
    ["connect", 0, 0, 0, 0, 0],
    ["startSession", 0, 0, 0, 0, 0],
    ["startTransaction", 0, 0, 0, 0, 1],
    ["currentRead", 1, 0, 0, 0, 1],
    ["previousRead", 1, 1, 0, 0, 1],
    ["replaceOne", 1, 1, 1, 0, 1],
    ["updateOne", 1, 1, 1, 1, 1],
  ])(
    "propagates %s failures, stops later writes and attempts cleanup",
    async (stage, reads, previousReads, snapshots, updates, endedSessions) => {
      const failure = new Error(`Synthetic ${stage} failure`);
      const operations = {
        connect: client.connect,
        startSession: client.startSession,
        startTransaction: session.startTransaction,
        currentRead: currentCursor.toArray,
        previousRead: previousCursor.toArray,
        replaceOne: diffCollection.replaceOne,
        updateOne: currenciesCollection.updateOne,
      };
      if (stage === "startSession" || stage === "startTransaction") {
        operations[stage].mockImplementation(() => {
          throw failure;
        });
      } else {
        operations[stage].mockRejectedValue(failure);
      }

      await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(
        failure,
      );

      expect(currentCursor.toArray).toHaveBeenCalledTimes(reads);
      expect(previousCursor.toArray).toHaveBeenCalledTimes(previousReads);
      expect(diffCollection.replaceOne).toHaveBeenCalledTimes(snapshots);
      expect(currenciesCollection.updateOne).toHaveBeenCalledTimes(updates);
      expect(client.close).toHaveBeenCalledTimes(1);
      expect(session.commitTransaction).not.toHaveBeenCalled();
      expect(session.abortTransaction).toHaveBeenCalledTimes(reads ? 1 : 0);
      expect(session.endSession).toHaveBeenCalledTimes(endedSessions);
      expect(errorLog).not.toHaveBeenCalled();
    },
  );

  test.each([
    "connect",
    "currentRead",
    "previousRead",
    "replaceOne",
    "updateOne",
  ])(
    "preserves the original %s error when cleanup also fails",
    async (stage) => {
      const failure = new Error(`Synthetic ${stage} failure`);
      const cleanupFailure = new Error("Synthetic cleanup failure");
      const operations = {
        connect: client.connect,
        currentRead: currentCursor.toArray,
        previousRead: previousCursor.toArray,
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
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).not.toHaveBeenCalled();
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

  test.each([
    [[], [], "latest", "latest", null],
    [[previousDocument], [], previousDocument._id, "latest", previousDocument],
    [[], [{ _id: "existing-history" }], "latest", "existing-history", null],
  ])(
    "handles missing documents without changing existing IDs (%#)",
    async (current, previous, currentId, previousId, snapshot) => {
      currentCursor.toArray.mockResolvedValue(current);
      previousCursor.toArray.mockResolvedValue(previous);

      await sendCurrenciesToMongoDB(testCurrencies);

      expect(diffCollection.replaceOne).toHaveBeenCalledWith(
        { _id: previousId },
        { data: snapshot, lastUpdated: expect.any(Date) },
        { upsert: true, session },
      );
      expect(currenciesCollection.updateOne).toHaveBeenCalledWith(
        { _id: currentId },
        expect.any(Object),
        { upsert: true, session },
      );
      expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    },
  );

  test.each([0, null])(
    "preserves an existing falsy document ID (%s)",
    async (id) => {
      currentCursor.toArray.mockResolvedValue([
        { ...previousDocument, _id: id },
      ]);
      previousCursor.toArray.mockResolvedValue([{ _id: id }]);

      await sendCurrenciesToMongoDB(testCurrencies);

      expect(currenciesCollection.updateOne.mock.calls[0][0]).toEqual({
        _id: id,
      });
      expect(diffCollection.replaceOne.mock.calls[0][0]).toEqual({ _id: id });
    },
  );

  test.each(["current", "previous"])(
    "rejects duplicate %s documents before any writes",
    async (collection) => {
      const cursor = collection === "current" ? currentCursor : previousCursor;
      cursor.toArray.mockResolvedValue([{ _id: "one" }, { _id: "two" }]);

      await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toThrow(
        "Expected at most one document per currency collection",
      );

      expect(diffCollection.replaceOne).not.toHaveBeenCalled();
      expect(currenciesCollection.updateOne).not.toHaveBeenCalled();
      expect(session.commitTransaction).not.toHaveBeenCalled();
      expect(session.abortTransaction).toHaveBeenCalledTimes(1);
      expect(session.endSession).toHaveBeenCalledTimes(1);
      expect(client.close).toHaveBeenCalledTimes(1);
    },
  );

  test("does not retry a write conflict and aborts the transaction", async () => {
    const failure = new Error("Synthetic write conflict");
    failure.errorLabels = ["TransientTransactionError"];
    currenciesCollection.updateOne.mockRejectedValue(failure);

    await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(failure);

    expect(session.startTransaction).toHaveBeenCalledTimes(1);
    expect(currenciesCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.commitTransaction).not.toHaveBeenCalled();
  });

  test("propagates an unknown commit result without attempting rollback", async () => {
    const failure = new Error("Synthetic unknown commit result");
    failure.errorLabels = ["UnknownTransactionCommitResult"];
    session.commitTransaction.mockImplementation(async () => {
      transactionActive = false;
      throw failure;
    });

    await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(failure);

    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
  });

  test("preserves a write failure when abort, session cleanup and close also fail", async () => {
    const failure = new Error("Synthetic write failure");
    currenciesCollection.updateOne.mockRejectedValue(failure);
    session.abortTransaction.mockRejectedValue(new Error("Abort failure"));
    session.endSession.mockRejectedValue(new Error("Session cleanup failure"));
    client.close.mockRejectedValue(new Error("Close failure"));

    await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(failure);

    expect(errorLog).toHaveBeenCalledTimes(3);
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
  });

  test("propagates session cleanup failure after commit and still closes the client", async () => {
    const failure = new Error("Synthetic session cleanup failure");
    session.endSession.mockRejectedValue(failure);
    client.close.mockRejectedValue(new Error("Synthetic close failure"));

    await expect(sendCurrenciesToMongoDB(testCurrencies)).rejects.toBe(failure);

    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(client.close).toHaveBeenCalledTimes(1);
  });
});
