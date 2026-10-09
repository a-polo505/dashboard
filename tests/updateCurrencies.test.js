import handler from "../api/updateCurrencies.js";
import { getCurrencies } from "../api/getCurrenciesFromCAPI.js";
import { sendCurrenciesToMongoDB } from "../api/mongoHandler.js";

jest.mock("../api/getCurrenciesFromCAPI.js", () => ({
  getCurrencies: jest.fn(),
}));
jest.mock("../api/mongoHandler.js", () => ({
  sendCurrenciesToMongoDB: jest.fn(),
}));

const testSecret = "a".repeat(64);
const testCurrencies = { USD: { code: "USD", value: 1 } };

function createResponse() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
}

describe("updateCurrencies authentication boundary", () => {
  const originalSecret = process.env.CRON_AUTH_SECRET;
  let errorLog;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.CRON_AUTH_SECRET = testSecret;
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    getCurrencies.mockResolvedValue(testCurrencies);
    sendCurrenciesToMongoDB.mockResolvedValue(undefined);
  });

  afterEach(() => {
    errorLog.mockRestore();
    if (originalSecret === undefined) {
      delete process.env.CRON_AUTH_SECRET;
    } else {
      process.env.CRON_AUTH_SECRET = originalSecret;
    }
  });

  test.each(["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "rejects %s before fetching or persisting data",
    async (method) => {
      const response = createResponse();

      await handler(
        { method, headers: { authorization: `Bearer ${testSecret}` } },
        response,
      );

      expect(response.setHeader).toHaveBeenCalledWith("Allow", "POST");
      expect(response.status).toHaveBeenCalledWith(405);
      expect(response.send).toHaveBeenCalledWith("Method Not Allowed");
      expect(getCurrencies).not.toHaveBeenCalled();
      expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();
      expect(errorLog).not.toHaveBeenCalled();
    },
  );

  test.each([undefined, "Bearer ", "Bearer incorrect", ["Bearer duplicate"]])(
    "rejects unauthorized POST without side effects (%#)",
    async (authorization) => {
      const response = createResponse();

      await handler({ method: "POST", headers: { authorization } }, response);

      expect(response.setHeader).toHaveBeenCalledWith(
        "WWW-Authenticate",
        "Bearer",
      );
      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.send).toHaveBeenCalledWith("Unauthorized");
      expect(getCurrencies).not.toHaveBeenCalled();
      expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();
      expect(errorLog).not.toHaveBeenCalled();
    },
  );

  test("rejects a request without headers", async () => {
    const response = createResponse();

    await handler({ method: "POST" }, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(getCurrencies).not.toHaveBeenCalled();
    expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();
  });

  test.each([undefined, "", " "])(
    "fails closed with invalid environment configuration (%#)",
    async (secret) => {
      if (secret === undefined) {
        delete process.env.CRON_AUTH_SECRET;
      } else {
        process.env.CRON_AUTH_SECRET = secret;
      }
      const response = createResponse();

      await handler(
        { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
        response,
      );

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.send).toHaveBeenCalledWith("Unauthorized");
      expect(getCurrencies).not.toHaveBeenCalled();
      expect(sendCurrenciesToMongoDB).not.toHaveBeenCalled();
      expect(errorLog).not.toHaveBeenCalled();
    },
  );

  test("preserves the authorized currency update flow", async () => {
    const response = createResponse();

    await handler(
      { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
      response,
    );

    expect(getCurrencies).toHaveBeenCalledTimes(1);
    expect(sendCurrenciesToMongoDB).toHaveBeenCalledTimes(1);
    expect(sendCurrenciesToMongoDB).toHaveBeenCalledWith(testCurrencies);
    expect(getCurrencies.mock.invocationCallOrder[0]).toBeLessThan(
      sendCurrenciesToMongoDB.mock.invocationCallOrder[0],
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith("Available currencies: USD");
    expect(errorLog).not.toHaveBeenCalled();
  });

  test.each(["fetch", "persistence"])(
    "preserves the error response when %s rejects",
    async (failure) => {
      const testError = new Error("Synthetic service failure");
      if (failure === "fetch") {
        getCurrencies.mockRejectedValue(testError);
      } else {
        sendCurrenciesToMongoDB.mockRejectedValue(testError);
      }
      const response = createResponse();

      await handler(
        { method: "POST", headers: { authorization: `Bearer ${testSecret}` } },
        response,
      );

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.send).toHaveBeenCalledWith("Internal Server Error");
      expect(response.status).not.toHaveBeenCalledWith(200);
      expect(sendCurrenciesToMongoDB).toHaveBeenCalledTimes(
        failure === "fetch" ? 0 : 1,
      );
    },
  );
});
