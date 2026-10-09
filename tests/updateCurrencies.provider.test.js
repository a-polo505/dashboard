import fetch from "node-fetch";
import handler from "../api/updateCurrencies.js";
import { sendCurrenciesToMongoDB } from "../api/mongoHandler.js";

jest.mock("node-fetch", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../api/mongoHandler.js", () => ({
  sendCurrenciesToMongoDB: jest.fn(),
}));

const testSecret = "a".repeat(64);
const testApiKey = "synthetic-api-key";
const testApiUrl = "https://currency-api.example.test/latest";
const validCurrencies = {
  USD: { code: "USD", value: 1 },
  UAH: { code: "UAH", value: 40 },
};

describe("updateCurrencies with the real Currency API helper", () => {
  const originalSecret = process.env.CRON_AUTH_SECRET;
  const originalKey = process.env.CURRENCYAPI_API_KEY;
  const originalUrl = process.env.CURRENCYAPI_API_URL;
  let providerResponse;
  let response;
  let errorLog;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    process.env.CRON_AUTH_SECRET = testSecret;
    process.env.CURRENCYAPI_API_KEY = testApiKey;
    process.env.CURRENCYAPI_API_URL = testApiUrl;
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    providerResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: validCurrencies }),
    };
    fetch.mockResolvedValue(providerResponse);
    sendCurrenciesToMongoDB.mockResolvedValue(undefined);
    response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    errorLog.mockRestore();
    if (originalSecret === undefined) {
      delete process.env.CRON_AUTH_SECRET;
    } else {
      process.env.CRON_AUTH_SECRET = originalSecret;
    }
    if (originalKey === undefined) {
      delete process.env.CURRENCYAPI_API_KEY;
    } else {
      process.env.CURRENCYAPI_API_KEY = originalKey;
    }
    if (originalUrl === undefined) {
      delete process.env.CURRENCYAPI_API_URL;
    } else {
      process.env.CURRENCYAPI_API_URL = originalUrl;
    }
  });

  test.each(["HTTP", "JSON", "schema", "network"])(
    "returns HTTP 500 without persistence for a provider %s failure",
    async (failure) => {
      if (failure === "HTTP") {
        providerResponse.ok = false;
        providerResponse.status = 429;
      } else if (failure === "JSON") {
        providerResponse.json.mockRejectedValue(
          new SyntaxError(`Invalid JSON containing ${testApiKey}`),
        );
      } else if (failure === "schema") {
        providerResponse.json.mockResolvedValue({
          data: { USD: { code: "USD", value: "invalid" } },
        });
      } else {
        fetch.mockRejectedValue(
          new Error(`Request to ${testApiUrl}?apikey=${testApiKey} failed`),
        );
      }

      await handler(
        { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
        response,
      );

      expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.send).toHaveBeenCalledWith("Internal Server Error");
      expect(errorLog).toHaveBeenCalledTimes(1);
      const loggedError = errorLog.mock.calls[0][1];
      expect(loggedError).toBeInstanceOf(Error);
      expect(loggedError.message).not.toContain(testApiKey);
      expect(loggedError.message).not.toContain(testApiUrl);
      expect(loggedError.cause).toBeUndefined();
    },
  );

  test("preserves the successful update for a valid response", async () => {
    await handler(
      { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
      response,
    );

    expect(sendCurrenciesToMongoDB).toHaveBeenCalledTimes(1);
    expect(sendCurrenciesToMongoDB).toHaveBeenCalledWith(validCurrencies);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(
      "Available currencies: USD, UAH",
    );
    expect(errorLog).not.toHaveBeenCalled();
  });

  test.each(["headers", "body"])(
    "returns HTTP 500 without persistence when waiting for %s times out",
    async (stage) => {
      fetch.mockImplementation((url, { signal }) => {
        const pending = new Promise((resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new Error(`Aborted request to ${url}`)),
            { once: true },
          );
        });
        providerResponse.json.mockReturnValue(pending);
        return stage === "headers"
          ? pending
          : Promise.resolve(providerResponse);
      });

      const pendingRequest = handler(
        { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
        response,
      );

      await jest.advanceTimersByTimeAsync(4999);
      expect(response.status).not.toHaveBeenCalled();
      expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      await pendingRequest;

      expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
      expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.send).toHaveBeenCalledWith("Internal Server Error");
      expect(errorLog).toHaveBeenCalledTimes(1);
      const loggedError = errorLog.mock.calls[0][1];
      expect(loggedError.message).toBe("Currency API request timed out");
      expect(loggedError.message).not.toContain(testApiKey);
      expect(loggedError.message).not.toContain(testApiUrl);
      expect(loggedError.cause).toBeUndefined();
      expect(jest.getTimerCount()).toBe(0);
    },
  );
});
