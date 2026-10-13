import {
  readCurrencyPreference,
  saveCurrencyPreference,
  removeCurrencyPreference,
} from "../src/utils/currencyPreferenceStorage.js";

describe("currency preference storage without DOM", () => {
  const originalStorage = Object.getOwnPropertyDescriptor(
    global,
    "localStorage",
  );
  let values;

  beforeEach(() => {
    values = new Map();
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      writable: true,
      value: {
        getItem: jest.fn((key) => values.get(key) ?? null),
        setItem: jest.fn((key, value) => values.set(key, String(value))),
        removeItem: jest.fn((key) => values.delete(key)),
      },
    });
  });

  afterEach(() => {
    if (originalStorage) {
      Object.defineProperty(global, "localStorage", originalStorage);
    } else {
      delete global.localStorage;
    }
  });

  test.each(["EUR", "UAH", "BYN", "", "UAH "])(
    "reads saved preference %s unchanged for validation against loaded rates",
    (currency) => {
      values.set("userCurrency", currency);

      expect(readCurrencyPreference()).toBe(currency);
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    },
  );

  test("returns null when no currency is saved", () => {
    expect(readCurrencyPreference()).toBeNull();
    expect(values.has("userCurrency")).toBe(false);
  });

  test("returns null when reading fails without modifying saved data", () => {
    values.set("userCurrency", "EUR");
    localStorage.getItem.mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    expect(readCurrencyPreference()).toBeNull();
    expect(values.get("userCurrency")).toBe("EUR");
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  test("saves a plain currency code without changing other preferences", () => {
    values.set("selectedDate", "2026-10-14");
    values.set("userCurrency", "UAH");

    saveCurrencyPreference("EUR");

    expect(readCurrencyPreference()).toBe("EUR");
    expect(values.get("selectedDate")).toBe("2026-10-14");
  });

  test("keeps the previous stored preference when writing fails", () => {
    values.set("userCurrency", "UAH");
    localStorage.setItem.mockImplementation(() => {
      throw new Error("Synthetic quota failure");
    });

    expect(() => saveCurrencyPreference("EUR")).not.toThrow();
    expect(readCurrencyPreference()).toBe("UAH");
  });

  test("removes only the currency preference", () => {
    values.set("userCurrency", "BYN");
    values.set("selectedDate", "2026-10-14");

    removeCurrencyPreference();

    expect(readCurrencyPreference()).toBeNull();
    expect(values.get("selectedDate")).toBe("2026-10-14");
  });

  test("does not throw when removal fails", () => {
    values.set("userCurrency", "BYN");
    localStorage.removeItem.mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    expect(() => removeCurrencyPreference()).not.toThrow();
    expect(readCurrencyPreference()).toBe("BYN");
  });

  test("supports a missing storage backend", () => {
    delete global.localStorage;

    expect(readCurrencyPreference()).toBeNull();
    expect(() => saveCurrencyPreference("EUR")).not.toThrow();
    expect(() => removeCurrencyPreference()).not.toThrow();
  });

  test("supports a storage backend whose access throws", () => {
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Synthetic blocked storage");
      },
    });

    expect(readCurrencyPreference()).toBeNull();
    expect(() => saveCurrencyPreference("EUR")).not.toThrow();
    expect(() => removeCurrencyPreference()).not.toThrow();
  });
});
