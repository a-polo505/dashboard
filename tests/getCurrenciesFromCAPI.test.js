import fetch from "node-fetch";
import { getCurrencies } from "../api/getCurrenciesFromCAPI.js";

jest.mock("node-fetch", () => ({ __esModule: true, default: jest.fn() }));

const testApiKey = "synthetic-api-key";
const testApiUrl = "https://currency-api.example.test/latest";
const validCurrencies = {
  USD: { code: "USD", value: 1 },
  UAH: { code: "UAH", value: 40 },
  EUR: { code: "EUR", value: 0.9 },
};

describe("Currency API response validation", () => {
  const originalKey = process.env.CURRENCYAPI_API_KEY;
  const originalUrl = process.env.CURRENCYAPI_API_URL;
  let response;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.CURRENCYAPI_API_KEY = testApiKey;
    process.env.CURRENCYAPI_API_URL = testApiUrl;
    response = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: validCurrencies }),
    };
    fetch.mockResolvedValue(response);
  });

  afterEach(() => {
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

  test("returns the original valid data without changing the request", async () => {
    await expect(getCurrencies()).resolves.toBe(validCurrencies);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`${testApiUrl}?apikey=${testApiKey}`);
  });

  test("preserves additional provider fields and currencies", async () => {
    const currencies = {
      ...validCurrencies,
      USD: { ...validCurrencies.USD, additionalField: "retained" },
      BTC: { code: "BTC", value: 0.00001 },
    };
    response.json.mockResolvedValue({
      meta: { last_updated_at: "2026-01-01T12:00:00Z" },
      data: currencies,
    });

    await expect(getCurrencies()).resolves.toBe(currencies);
  });

  test.each(["OP", "USDT", "MATIC"])(
    "accepts a provider ticker with a non-ISO length (%s)",
    async (code) => {
      const currencies = {
        ...validCurrencies,
        [code]: { code, value: 0.5 },
      };
      response.json.mockResolvedValue({ data: currencies });

      await expect(getCurrencies()).resolves.toBe(currencies);
    },
  );

  test.each([401, 403, 429, 500, 503])(
    "rejects HTTP %s before reading the response body",
    async (status) => {
      response.ok = false;
      response.status = status;

      await expect(getCurrencies()).rejects.toThrow(
        `Currency API request failed (HTTP ${status})`,
      );
      expect(response.json).not.toHaveBeenCalled();
    },
  );

  test("sanitizes network errors that contain the request credentials", async () => {
    fetch.mockRejectedValue(
      new Error(`Request to ${testApiUrl}?apikey=${testApiKey} failed`),
    );

    await expect(getCurrencies()).rejects.toThrow(
      /^Currency API request failed$/,
    );
    expect(response.json).not.toHaveBeenCalled();
  });

  test("sanitizes malformed JSON errors and response details", async () => {
    response.json.mockRejectedValue(
      new SyntaxError(`Invalid JSON from ${testApiUrl}?apikey=${testApiKey}`),
    );

    await expect(getCurrencies()).rejects.toThrow(
      /^Currency API returned invalid JSON$/,
    );
  });

  test.each([
    ["missing payload", undefined],
    ["null payload", null],
    ["string payload", "provider error"],
    ["missing data", {}],
    ["error envelope", { error: { message: "provider failure" } }],
    ["null data", { data: null }],
    ["empty data", { data: {} }],
    ["array data", { data: [] }],
    ["string data", { data: "invalid" }],
    ["numeric data", { data: 123 }],
    ["missing USD", { data: { UAH: validCurrencies.UAH } }],
    ["missing UAH", { data: { USD: validCurrencies.USD } }],
  ])("rejects %s", async (description, payload) => {
    response.json.mockResolvedValue(payload);

    await expect(getCurrencies()).rejects.toThrow(
      /^Currency API returned invalid currency data$/,
    );
  });

  test.each([
    ["null entry", null],
    ["array entry", []],
    ["string entry", "USD"],
    ["missing code", { value: 1 }],
    ["mismatched code", { code: "EUR", value: 1 }],
    ["missing value", { code: "USD" }],
    ["string value", { code: "USD", value: "1" }],
    ["null value", { code: "USD", value: null }],
    ["zero value", { code: "USD", value: 0 }],
    ["negative value", { code: "USD", value: -1 }],
    ["NaN value", { code: "USD", value: NaN }],
    ["infinite value", { code: "USD", value: Infinity }],
  ])("rejects a currency with %s", async (description, entry) => {
    response.json.mockResolvedValue({
      data: { ...validCurrencies, USD: entry },
    });

    await expect(getCurrencies()).rejects.toThrow(
      /^Currency API returned invalid currency data$/,
    );
  });

  test.each([
    "",
    "usd",
    "USD ",
    "USD\n",
    "<script>",
    "__proto__",
    "USD$",
    "A.B",
  ])("rejects an invalid currency key (%#)", async (code) => {
    response.json.mockResolvedValue({
      data: { ...validCurrencies, [code]: { code, value: 1 } },
    });

    await expect(getCurrencies()).rejects.toThrow(
      /^Currency API returned invalid currency data$/,
    );
  });

  test("rejects invalid optional currencies instead of saving a partial dataset", async () => {
    response.json.mockResolvedValue({
      data: { ...validCurrencies, EUR: { code: "EUR", value: "invalid" } },
    });

    await expect(getCurrencies()).rejects.toThrow(
      /^Currency API returned invalid currency data$/,
    );
  });
});
