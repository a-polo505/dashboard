import {
  readCountdownDate,
  saveCountdownDate,
  removeCountdownDate,
} from "../src/utils/countdownDateStorage.js";

describe("countdown date storage without DOM", () => {
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

  test.each(["2026-10-14", "2028-02-29", "invalid", ""])(
    "reads the saved value %s unchanged for validation by the widget",
    (date) => {
      values.set("selectedDate", date);

      expect(readCountdownDate()).toBe(date);
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    },
  );

  test("returns null for a missing key even when a fallback is supplied", () => {
    expect(readCountdownDate("2026-10-14")).toBeNull();
  });

  test.each([null, "2026-10-14"])(
    "preserves fallback %s when reading fails",
    (fallback) => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error("Synthetic storage failure");
      });

      expect(readCountdownDate(fallback)).toBe(fallback);
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    },
  );

  test("saves the date as a plain string without changing other preferences", () => {
    values.set("userCurrency", "EUR");

    saveCountdownDate("2026-10-14");

    expect(values.get("selectedDate")).toBe("2026-10-14");
    expect(values.get("userCurrency")).toBe("EUR");
    expect(readCountdownDate()).toBe("2026-10-14");
  });

  test("keeps the previous stored value when writing fails", () => {
    values.set("selectedDate", "2026-10-14");
    localStorage.setItem.mockImplementation(() => {
      throw new Error("Synthetic quota failure");
    });

    expect(() => saveCountdownDate("2026-10-15")).not.toThrow();
    expect(readCountdownDate()).toBe("2026-10-14");
  });

  test("removes only the saved date", () => {
    values.set("selectedDate", "invalid");
    values.set("userCurrency", "EUR");

    removeCountdownDate();

    expect(readCountdownDate()).toBeNull();
    expect(values.get("userCurrency")).toBe("EUR");
  });

  test("does not throw when removing a stored value fails", () => {
    values.set("selectedDate", "invalid");
    localStorage.removeItem.mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    expect(() => removeCountdownDate()).not.toThrow();
    expect(readCountdownDate()).toBe("invalid");
  });

  test("supports a missing storage backend", () => {
    delete global.localStorage;

    expect(readCountdownDate()).toBeNull();
    expect(readCountdownDate("2026-10-14")).toBe("2026-10-14");
    expect(() => saveCountdownDate("2026-10-14")).not.toThrow();
    expect(() => removeCountdownDate()).not.toThrow();
  });

  test("supports a storage backend whose access throws", () => {
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Synthetic blocked storage");
      },
    });

    expect(readCountdownDate()).toBeNull();
    expect(readCountdownDate("2026-10-14")).toBe("2026-10-14");
    expect(() => saveCountdownDate("2026-10-14")).not.toThrow();
    expect(() => removeCountdownDate()).not.toThrow();
  });
});
