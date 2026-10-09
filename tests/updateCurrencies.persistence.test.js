import { MongoClient } from "mongodb";
import { getCurrencies } from "../api/getCurrenciesFromCAPI.js";

jest.mock("mongodb", () => ({ MongoClient: jest.fn() }));
jest.mock("../api/getCurrenciesFromCAPI.js", () => ({
  getCurrencies: jest.fn(),
}));

const testSecret = "a".repeat(64);
const testCurrencies = { USD: { code: "USD", value: 1 } };

describe("updateCurrencies with the real persistence helper", () => {
  const originalSecret = process.env.CRON_AUTH_SECRET;
  const originalUri = process.env.MONGODB_URI;
  let handler;
  let client;
  let currenciesCollection;
  let diffCollection;
  let response;
  let session;
  let currentCursor;
  let previousCursor;
  let transactionActive;
  let errorLog;

  beforeAll(() => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/synthetic-test-db";
    handler = jest.requireActual("../api/updateCurrencies.js").default;
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
    process.env.CRON_AUTH_SECRET = testSecret;
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    getCurrencies.mockResolvedValue(testCurrencies);
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
      toArray: jest
        .fn()
        .mockResolvedValue([{ _id: "current", data: testCurrencies }]),
    };
    previousCursor = {
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([{ _id: "previous" }]),
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
    response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    errorLog.mockRestore();
    if (originalSecret === undefined) {
      delete process.env.CRON_AUTH_SECRET;
    } else {
      process.env.CRON_AUTH_SECRET = originalSecret;
    }
  });

  test.each([
    "connect",
    "startSession",
    "startTransaction",
    "currentRead",
    "previousRead",
    "replaceOne",
    "updateOne",
    "commitTransaction",
    "endSession",
    "close",
  ])("returns HTTP 500 instead of 200 when MongoDB %s fails", async (stage) => {
    const failure = new Error(`Synthetic ${stage} failure`);
    const operations = {
      connect: client.connect,
      startSession: client.startSession,
      startTransaction: session.startTransaction,
      currentRead: currentCursor.toArray,
      previousRead: previousCursor.toArray,
      replaceOne: diffCollection.replaceOne,
      updateOne: currenciesCollection.updateOne,
      close: client.close,
      commitTransaction: session.commitTransaction,
      endSession: session.endSession,
    };
    if (stage === "startSession" || stage === "startTransaction") {
      operations[stage].mockImplementation(() => {
        throw failure;
      });
    } else if (stage === "commitTransaction") {
      operations[stage].mockImplementation(async () => {
        transactionActive = false;
        throw failure;
      });
    } else {
      operations[stage].mockRejectedValue(failure);
    }

    await handler(
      { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
      response,
    );

    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.status).not.toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith("Internal Server Error");
    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(errorLog).toHaveBeenCalledWith(
      "Error fetching and formatting data:",
      failure,
    );
    expect(client.close).toHaveBeenCalledTimes(1);
  });

  test("reports the original write error when cleanup also fails", async () => {
    const failure = new Error("Synthetic write failure");
    currenciesCollection.updateOne.mockRejectedValue(failure);
    client.close.mockRejectedValue(new Error("Synthetic cleanup failure"));

    await handler(
      { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith("Internal Server Error");
    expect(errorLog).toHaveBeenCalledWith(
      "Error fetching and formatting data:",
      failure,
    );
  });

  test("preserves HTTP 200 after successful writes and cleanup", async () => {
    await handler(
      { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
      response,
    );

    expect(diffCollection.replaceOne).toHaveBeenCalledTimes(1);
    expect(currenciesCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(client.close.mock.invocationCallOrder[0]).toBeLessThan(
      response.status.mock.invocationCallOrder[0],
    );
    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith("Available currencies: USD");
    expect(errorLog).not.toHaveBeenCalled();
  });

  test.each(["current", "previous"])(
    "returns HTTP 500 for duplicate %s documents without writing",
    async (collection) => {
      const cursor = collection === "current" ? currentCursor : previousCursor;
      cursor.toArray.mockResolvedValue([{ _id: "one" }, { _id: "two" }]);

      await handler(
        { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
        response,
      );

      expect(response.status).toHaveBeenCalledWith(500);
      expect(diffCollection.replaceOne).not.toHaveBeenCalled();
      expect(currenciesCollection.updateOne).not.toHaveBeenCalled();
      expect(session.abortTransaction).toHaveBeenCalledTimes(1);
      expect(session.endSession).toHaveBeenCalledTimes(1);
      expect(client.close).toHaveBeenCalledTimes(1);
    },
  );

  test("does not report success while commit is pending", async () => {
    let resolveCommit;
    let notifyCommit;
    const commitStarted = new Promise((resolve) => {
      notifyCommit = resolve;
    });
    const commitFinished = new Promise((resolve) => {
      resolveCommit = resolve;
    });
    session.commitTransaction.mockImplementation(async () => {
      notifyCommit();
      await commitFinished;
      transactionActive = false;
    });

    const request = handler(
      { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
      response,
    );
    await commitStarted;

    expect(response.status).not.toHaveBeenCalled();
    expect(session.endSession).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();

    resolveCommit();
    await request;
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
