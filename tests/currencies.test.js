import express from "express";
import { MongoClient } from "mongodb";

jest.mock("express", () => jest.fn());
jest.mock("mongodb", () => ({ MongoClient: { connect: jest.fn() } }));

const currentDocument = {
  _id: "current",
  data: { USD: { code: "USD", value: 1 }, UAH: { code: "UAH", value: 40 } },
};
const previousDocument = {
  _id: "previous",
  data: { _id: "current", data: { UAH: { code: "UAH", value: 39 } } },
};

function createSession() {
  let active = false;
  return {
    startTransaction: jest.fn(() => {
      active = true;
    }),
    commitTransaction: jest.fn(async () => {
      active = false;
    }),
    abortTransaction: jest.fn(async () => {
      active = false;
    }),
    inTransaction: jest.fn(() => active),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
}

describe("currency reads in a snapshot transaction", () => {
  const originalUri = process.env.MONGODB_URI;
  const currentCollection = { find: jest.fn() };
  const previousCollection = { find: jest.fn() };
  const client = {
    db: jest.fn(),
    startSession: jest.fn(),
    close: jest.fn(),
  };
  let handler;
  let registeredPath;
  let session;
  let currentCursor;
  let previousCursor;
  let response;
  let errorLog;

  beforeAll(async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/synthetic-test-db";
    const app = { get: jest.fn(), listen: jest.fn() };
    express.mockReturnValue(app);
    client.db.mockReturnValue({
      collection: jest.fn((name) =>
        name === "currencies" ? currentCollection : previousCollection,
      ),
    });
    MongoClient.connect.mockResolvedValue(client);
    jest.requireActual("../api/currencies.js");
    await Promise.resolve();
    [registeredPath, handler] = app.get.mock.calls[0];
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
    session = createSession();
    client.startSession.mockReturnValue(session);
    currentCursor = {
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([currentDocument]),
    };
    previousCursor = {
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([previousDocument]),
    };
    currentCollection.find.mockReturnValue(currentCursor);
    previousCollection.find.mockReturnValue(previousCursor);
    response = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    errorLog.mockRestore();
  });

  test("reads both collections in the same snapshot and preserves the response format", async () => {
    expect(registeredPath).toBe("/api/currencies");
    await handler({}, response);

    expect(session.startTransaction).toHaveBeenCalledWith({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });
    expect(currentCollection.find).toHaveBeenCalledWith({}, { session });
    expect(previousCollection.find).toHaveBeenCalledWith({}, { session });
    expect(currentCursor.limit).toHaveBeenCalledWith(2);
    expect(previousCursor.limit).toHaveBeenCalledWith(2);
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(previousCursor.toArray.mock.invocationCallOrder[0]).toBeLessThan(
      session.commitTransaction.mock.invocationCallOrder[0],
    );
    expect(session.commitTransaction.mock.invocationCallOrder[0]).toBeLessThan(
      session.endSession.mock.invocationCallOrder[0],
    );
    expect(session.endSession.mock.invocationCallOrder[0]).toBeLessThan(
      response.json.mock.invocationCallOrder[0],
    );
    expect(response.json).toHaveBeenCalledWith({
      currencies: [currentDocument],
      currenciesDiff: [previousDocument.data],
    });
    expect(response.json).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
  });

  test.each([
    [[], [], { currencies: [], currenciesDiff: [] }],
    [
      [currentDocument],
      [],
      { currencies: [currentDocument], currenciesDiff: [] },
    ],
    [
      [currentDocument],
      [{ _id: "previous", data: null }],
      { currencies: [currentDocument], currenciesDiff: [null] },
    ],
  ])(
    "handles empty collections and missing historical data (%#)",
    async (current, previous, expected) => {
      currentCursor.toArray.mockResolvedValue(current);
      previousCursor.toArray.mockResolvedValue(previous);

      await handler({}, response);

      expect(response.json).toHaveBeenCalledWith(expected);
      expect(session.commitTransaction).toHaveBeenCalledTimes(1);
      expect(session.endSession).toHaveBeenCalledTimes(1);
    },
  );

  test.each(["current", "previous"])(
    "rejects duplicate %s documents",
    async (collection) => {
      const cursor = collection === "current" ? currentCursor : previousCursor;
      cursor.toArray.mockResolvedValue([{ _id: "one" }, { _id: "two" }]);

      await handler({}, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.send).toHaveBeenCalledWith("Server error");
      expect(response.json).not.toHaveBeenCalled();
      expect(session.commitTransaction).not.toHaveBeenCalled();
      expect(session.abortTransaction).toHaveBeenCalledTimes(1);
      expect(session.endSession).toHaveBeenCalledTimes(1);
      expect(client.close).not.toHaveBeenCalled();
    },
  );

  test.each([
    "startSession",
    "startTransaction",
    "currentRead",
    "previousRead",
    "commit",
    "endSession",
  ])(
    "returns HTTP 500 on %s failure and preserves the original error",
    async (stage) => {
      const failure = new Error(`Synthetic ${stage} failure`);
      const operations = {
        startSession: client.startSession,
        startTransaction: session.startTransaction,
        currentRead: currentCursor.toArray,
        previousRead: previousCursor.toArray,
        commit: session.commitTransaction,
        endSession: session.endSession,
      };
      if (stage === "startSession" || stage === "startTransaction") {
        operations[stage].mockImplementation(() => {
          throw failure;
        });
      } else if (stage === "commit") {
        session.commitTransaction.mockImplementation(async () => {
          session.inTransaction.mockReturnValue(false);
          throw failure;
        });
      } else {
        operations[stage].mockRejectedValue(failure);
      }

      await handler({}, response);

      expect(response.status).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.send).toHaveBeenCalledWith("Server error");
      expect(response.json).not.toHaveBeenCalled();
      expect(errorLog).toHaveBeenCalledWith(
        "Error retrieving data from the database:",
        failure,
      );
      expect(session.endSession).toHaveBeenCalledTimes(
        stage === "startSession" ? 0 : 1,
      );
      expect(session.abortTransaction).toHaveBeenCalledTimes(
        stage === "currentRead" || stage === "previousRead" ? 1 : 0,
      );
      expect(client.close).not.toHaveBeenCalled();
    },
  );

  test("preserves a read failure when abort and session cleanup also fail", async () => {
    const failure = new Error("Synthetic read failure");
    currentCursor.toArray.mockRejectedValue(failure);
    session.abortTransaction.mockRejectedValue(
      new Error("Synthetic abort failure"),
    );
    session.endSession.mockRejectedValue(
      new Error("Synthetic cleanup failure"),
    );

    await handler({}, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenLastCalledWith(
      "Error retrieving data from the database:",
      failure,
    );
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(client.close).not.toHaveBeenCalled();
  });

  test("uses a separate session for each request and keeps the shared client open", async () => {
    const secondSession = createSession();
    client.startSession
      .mockReturnValueOnce(session)
      .mockReturnValueOnce(secondSession);

    await handler({}, response);
    await handler({}, response);

    expect(currentCollection.find).toHaveBeenNthCalledWith(1, {}, { session });
    expect(previousCollection.find).toHaveBeenNthCalledWith(1, {}, { session });
    expect(currentCollection.find).toHaveBeenNthCalledWith(
      2,
      {},
      { session: secondSession },
    );
    expect(previousCollection.find).toHaveBeenNthCalledWith(
      2,
      {},
      { session: secondSession },
    );
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(secondSession.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(secondSession.endSession).toHaveBeenCalledTimes(1);
    expect(client.close).not.toHaveBeenCalled();
  });

  test("does not send data before commit completes", async () => {
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
      session.inTransaction.mockReturnValue(false);
    });

    const request = handler({}, response);
    await commitStarted;

    expect(response.json).not.toHaveBeenCalled();
    expect(response.status).not.toHaveBeenCalled();
    expect(session.endSession).not.toHaveBeenCalled();

    resolveCommit();
    await request;
    expect(response.json).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
