/** @jest-environment jsdom */

import { widgetCurrencyRender } from "../src/utils/widgetCurrencyRender.js";
import { getParsedData } from "../src/utils/storageUtils.js";

const currencies = [
  {
    data: {
      USD: { code: "USD", value: 1 },
      UAH: { code: "UAH", value: 41 },
      EUR: { code: "EUR", value: 0.9 },
    },
  },
];
const currenciesDiff = [
  {
    data: {
      UAH: { code: "UAH", value: 40 },
      EUR: { code: "EUR", value: 1 },
      BYN: { code: "BYN", value: 3 },
    },
  },
];

describe("currency widget selection recovery", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.spyOn(window.Storage.prototype, "removeItem");
    jest.spyOn(window.Storage.prototype, "setItem");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(["BYN", "RUB", "ZZZ", "toString", "", "UAH "])(
    "removes an unavailable stored selection and renders UAH (%#)",
    (code) => {
      localStorage.setItem("userCurrency", code);
      localStorage.setItem("otherSetting", "retained");

      const content = widgetCurrencyRender(currencies, currenciesDiff);

      expect(content).toContain("USD / UAH");
      expect(content).toContain('id="rate" class="flex currency--rate">41<');
      expect(localStorage.getItem("userCurrency")).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith("userCurrency");
      expect(localStorage.getItem("otherSetting")).toBe("retained");
    },
  );

  test("recovers a cached selection without changing cached rates", () => {
    localStorage.setItem("userCurrency", "BYN");
    const currentCache = JSON.stringify(currencies);
    const historicalCache = JSON.stringify(currenciesDiff);
    sessionStorage.setItem("currencies", currentCache);
    sessionStorage.setItem("currenciesDiff", historicalCache);

    const content = widgetCurrencyRender(
      getParsedData("currencies"),
      getParsedData("currenciesDiff"),
    );

    expect(content).toContain("USD / UAH");
    expect(localStorage.getItem("userCurrency")).toBeNull();
    expect(sessionStorage.getItem("currencies")).toBe(currentCache);
    expect(sessionStorage.getItem("currenciesDiff")).toBe(historicalCache);
  });

  test("uses UAH without storing a preference when no selection exists", () => {
    const content = widgetCurrencyRender(currencies, currenciesDiff);

    expect(content).toContain("USD / UAH");
    expect(localStorage.getItem("userCurrency")).toBeNull();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test("preserves a valid selection and its existing percentage calculation", () => {
    localStorage.setItem("userCurrency", "EUR");

    const content = widgetCurrencyRender(currencies, currenciesDiff);

    expect(content).toContain("USD / EUR");
    expect(content).toContain('id="rate" class="flex currency--rate">0.9<');
    expect(content).toContain("currency--percentage negative");
    expect(content).toContain("10%");
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  test("bases availability on current data without a hardcoded currency blacklist", () => {
    localStorage.setItem("userCurrency", "BYN");
    const currentCurrencies = [
      { data: { ...currencies[0].data, BYN: { code: "BYN", value: 3 } } },
    ];

    const content = widgetCurrencyRender(currentCurrencies, currenciesDiff);

    expect(content).toContain("USD / BYN");
    expect(localStorage.getItem("userCurrency")).toBe("BYN");
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  test.each([
    ["missing history", undefined],
    ["null history", null],
    ["empty history", []],
    ["missing historical data", [{}]],
    ["null historical data", [{ data: null }]],
    [
      "missing selected currency in history",
      [{ data: { UAH: { value: 40 } } }],
    ],
  ])("keeps a valid selection with %s", (description, history) => {
    localStorage.setItem("userCurrency", "EUR");

    const content = widgetCurrencyRender(currencies, history);

    expect(content).toContain("USD / EUR");
    expect(content).toContain("currency--percentage neutral");
    expect(content).toContain("0.00%");
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  test("recovers an unavailable selection even when history is absent", () => {
    localStorage.setItem("userCurrency", "BYN");

    const content = widgetCurrencyRender(currencies, []);

    expect(content).toContain("USD / UAH");
    expect(content).toContain("currency--percentage neutral");
    expect(localStorage.getItem("userCurrency")).toBeNull();
  });

  test.each([
    ["missing payload", undefined],
    ["null payload", null],
    ["empty payload", []],
    ["error response", { error: "Server error" }],
    ["missing data", [{}]],
    ["null data", [{ data: null }]],
    ["array data", [{ data: [] }]],
    ["empty data", [{ data: {} }]],
    ["missing USD", [{ data: { UAH: currencies[0].data.UAH } }]],
    ["missing UAH", [{ data: { USD: currencies[0].data.USD } }]],
    [
      "invalid rate",
      [{ data: { ...currencies[0].data, EUR: { code: "EUR", value: "0.9" } } }],
    ],
    [
      "mismatched currency code",
      [{ data: { ...currencies[0].data, EUR: { code: "GBP", value: 0.9 } } }],
    ],
  ])(
    "does not discard preferences for %s",
    (description, currentCurrencies) => {
      localStorage.setItem("userCurrency", "BYN");

      expect(() =>
        widgetCurrencyRender(currentCurrencies, currenciesDiff),
      ).toThrow("Invalid currency data");

      expect(localStorage.getItem("userCurrency")).toBe("BYN");
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    },
  );
});
