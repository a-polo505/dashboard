/** @jest-environment jsdom */

import {
  cacheCurrencyData,
  readCachedCurrencyData,
} from "../src/utils/currencyCache.js";

const previous = {
  currencies: [
    {
      data: { USD: { code: "USD", value: 1 }, UAH: { code: "UAH", value: 40 } },
    },
  ],
  currenciesDiff: [{ data: { UAH: { code: "UAH", value: 39 } } }],
};
const current = {
  currencies: [
    {
      data: { USD: { code: "USD", value: 1 }, UAH: { code: "UAH", value: 41 } },
    },
  ],
  currenciesDiff: previous.currencies,
};

function saveLegacy(data = previous) {
  sessionStorage.setItem("currencies", JSON.stringify(data.currencies));
  sessionStorage.setItem("currenciesDiff", JSON.stringify(data.currenciesDiff));
}

describe("currency snapshot cache", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("replaces both current and historical rates with one write and removes only legacy keys", () => {
    saveLegacy();
    sessionStorage.setItem("otherSetting", "retained");
    const write = jest.spyOn(window.Storage.prototype, "setItem");

    cacheCurrencyData(current);

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(
      "currencySnapshot",
      JSON.stringify(current),
    );
    expect(readCachedCurrencyData()).toEqual(current);
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
    expect(sessionStorage.getItem("otherSetting")).toBe("retained");
  });

  test("retains the complete previous snapshot on a failed write without attempting rollback or cleanup", () => {
    sessionStorage.setItem("currencySnapshot", JSON.stringify(previous));
    saveLegacy();
    const write = jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Synthetic quota failure");
      });
    const remove = jest.spyOn(window.Storage.prototype, "removeItem");

    expect(() => cacheCurrencyData(current)).not.toThrow();

    expect(write).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    expect(readCachedCurrencyData()).toEqual(previous);
    expect(sessionStorage.getItem("currencies")).toBe(
      JSON.stringify(previous.currencies),
    );
    expect(console.error).toHaveBeenCalledWith("Error caching currency data");
  });

  test("does not write or delete existing data when serialization fails", () => {
    sessionStorage.setItem("currencySnapshot", JSON.stringify(previous));
    const circularHistory = [];
    circularHistory.push(circularHistory);
    const write = jest.spyOn(window.Storage.prototype, "setItem");
    const remove = jest.spyOn(window.Storage.prototype, "removeItem");

    cacheCurrencyData({ ...current, currenciesDiff: circularHistory });

    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(readCachedCurrencyData()).toEqual(previous);
  });

  test.each([null, {}, { currencies: [] }, { currencies: [{}] }])(
    "does not overwrite a valid snapshot with invalid current data (%#)",
    (data) => {
      sessionStorage.setItem("currencySnapshot", JSON.stringify(previous));
      const write = jest.spyOn(window.Storage.prototype, "setItem");

      cacheCurrencyData(data);

      expect(write).not.toHaveBeenCalled();
      expect(readCachedCurrencyData()).toEqual(previous);
    },
  );

  test("reads a valid snapshot without writing and gives it priority over legacy data", () => {
    saveLegacy();
    sessionStorage.setItem("currencySnapshot", JSON.stringify(current));
    const write = jest.spyOn(window.Storage.prototype, "setItem");

    expect(readCachedCurrencyData()).toEqual(current);
    expect(write).not.toHaveBeenCalled();
  });

  test.each(["", "broken JSON", "null", "[]", "{}", '{"currencies":[{}]}'])(
    "rejects an invalid snapshot instead of reviving stale legacy data (%s)",
    (snapshot) => {
      saveLegacy();
      sessionStorage.setItem("currencySnapshot", snapshot);
      const write = jest.spyOn(window.Storage.prototype, "setItem");

      expect(readCachedCurrencyData()).toBeNull();
      expect(write).not.toHaveBeenCalled();
    },
  );

  test("returns no cache when it is absent or storage cannot be read", () => {
    expect(readCachedCurrencyData()).toBeNull();
    jest.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Synthetic storage access failure");
    });
    expect(readCachedCurrencyData()).toBeNull();
  });

  test("migrates a valid legacy pair and subsequently reads the new snapshot", () => {
    saveLegacy();

    expect(readCachedCurrencyData()).toEqual(previous);
    expect(sessionStorage.getItem("currencySnapshot")).toBe(
      JSON.stringify(previous),
    );
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
    expect(readCachedCurrencyData()).toEqual(previous);
  });

  test.each([null, "broken JSON", "null", "{}"])(
    "migrates valid legacy rates without usable historical data (%s)",
    (history) => {
      sessionStorage.setItem("currencies", JSON.stringify(previous.currencies));
      if (history !== null) sessionStorage.setItem("currenciesDiff", history);
      const expected = { ...previous, currenciesDiff: [] };

      expect(readCachedCurrencyData()).toEqual(expected);
      expect(JSON.parse(sessionStorage.getItem("currencySnapshot"))).toEqual(
        expected,
      );
    },
  );

  test.each([null, "broken JSON", "[]", "[{}]"])(
    "does not migrate unusable legacy current rates (%s)",
    (rates) => {
      saveLegacy();
      if (rates === null) sessionStorage.removeItem("currencies");
      else sessionStorage.setItem("currencies", rates);
      const write = jest.spyOn(window.Storage.prototype, "setItem");

      expect(readCachedCurrencyData()).toBeNull();
      expect(write).not.toHaveBeenCalled();
      expect(sessionStorage.getItem("currencySnapshot")).toBeNull();
      expect(sessionStorage.getItem("currenciesDiff")).toBe(
        JSON.stringify(previous.currenciesDiff),
      );
    },
  );

  test("returns legacy rates after a failed migration and preserves them for a later retry", () => {
    saveLegacy();
    const write = jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Synthetic quota failure");
      });

    expect(readCachedCurrencyData()).toEqual(previous);
    expect(sessionStorage.getItem("currencySnapshot")).toBeNull();
    expect(sessionStorage.getItem("currencies")).toBe(
      JSON.stringify(previous.currencies),
    );
    expect(sessionStorage.getItem("currenciesDiff")).toBe(
      JSON.stringify(previous.currenciesDiff),
    );

    write.mockRestore();
    expect(readCachedCurrencyData()).toEqual(previous);
    expect(sessionStorage.getItem("currencySnapshot")).toBe(
      JSON.stringify(previous),
    );
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
  });

  test("keeps the new snapshot authoritative when legacy cleanup fails", () => {
    saveLegacy();
    const remove = jest
      .spyOn(window.Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("Synthetic cleanup failure");
      });

    expect(() => cacheCurrencyData(current)).not.toThrow();
    expect(remove).toHaveBeenCalledTimes(2);
    expect(readCachedCurrencyData()).toEqual(current);
    expect(sessionStorage.getItem("currencies")).toBe(
      JSON.stringify(previous.currencies),
    );
    expect(sessionStorage.getItem("currenciesDiff")).toBe(
      JSON.stringify(previous.currenciesDiff),
    );
    expect(console.error).not.toHaveBeenCalled();
  });
});
