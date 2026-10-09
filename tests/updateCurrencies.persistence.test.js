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
    currenciesCollection = {
      findOne: jest.fn().mockResolvedValue({ data: testCurrencies }),
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

  test.each(["connect", "findOne", "replaceOne", "updateOne", "close"])(
    "returns HTTP 500 instead of 200 when MongoDB %s fails",
    async (stage) => {
      const failure = new Error(`Synthetic ${stage} failure`);
      const operations = {
        connect: client.connect,
        findOne: currenciesCollection.findOne,
        replaceOne: diffCollection.replaceOne,
        updateOne: currenciesCollection.updateOne,
        close: client.close,
      };
      operations[stage].mockRejectedValue(failure);

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
    },
  );

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
    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith("Available currencies: USD");
    expect(errorLog).not.toHaveBeenCalled();
  });
});
