import {
  readThemePreference,
  saveThemePreference,
} from "../src/utils/themePreferenceStorage.js";

describe("theme preference storage without DOM", () => {
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

  test("uses light without writing or removing an absent preference", () => {
    expect(readThemePreference()).toBe("light");
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
    expect(values.size).toBe(0);
  });

  test("restores dark without rewriting the saved value", () => {
    values.set("theme", "dark");

    expect(readThemePreference()).toBe("dark");
    expect(values.get("theme")).toBe("dark");
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  test.each(["light", "", "system", "DARK", " dark ", '"dark"', "null", "{}"])(
    "uses light and removes a noncanonical saved value (%s)",
    (theme) => {
      values.set("theme", theme);
      values.set("userCurrency", "UAH");
      values.set("selectedDate", "2026-10-14");

      expect(readThemePreference()).toBe("light");
      expect(values.has("theme")).toBe(false);
      expect(values.get("userCurrency")).toBe("UAH");
      expect(values.get("selectedDate")).toBe("2026-10-14");
      expect(localStorage.setItem).not.toHaveBeenCalled();
    },
  );

  test("uses light when reading fails without altering saved preferences", () => {
    values.set("theme", "dark");
    localStorage.getItem.mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    expect(readThemePreference()).toBe("light");
    expect(values.get("theme")).toBe("dark");
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  test.each(["light", "invalid"])(
    "still uses light when removing saved %s fails",
    (theme) => {
      values.set("theme", theme);
      localStorage.removeItem.mockImplementation(() => {
        throw new Error("Synthetic storage failure");
      });

      expect(readThemePreference()).toBe("light");
      expect(values.get("theme")).toBe(theme);
    },
  );

  test("saves dark as a plain string without touching other preferences", () => {
    values.set("userCurrency", "EUR");

    saveThemePreference("dark");

    expect(readThemePreference()).toBe("dark");
    expect(values.get("theme")).toBe("dark");
    expect(values.get("userCurrency")).toBe("EUR");
  });

  test("represents a return to light by removing only the theme key", () => {
    values.set("theme", "dark");
    values.set("coffeeCupsProgress", "2");

    saveThemePreference("light");

    expect(readThemePreference()).toBe("light");
    expect(values.has("theme")).toBe(false);
    expect(values.get("coffeeCupsProgress")).toBe("2");
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test.each(["light", "invalid"])(
    "never writes a non-dark preference (%s)",
    (theme) => {
      saveThemePreference(theme);

      expect(values.has("theme")).toBe(false);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    },
  );

  test("does not throw when saving dark exceeds the storage quota", () => {
    localStorage.setItem.mockImplementation(() => {
      throw new Error("Synthetic quota failure");
    });

    expect(() => saveThemePreference("dark")).not.toThrow();
    expect(values.has("theme")).toBe(false);
  });

  test("does not throw when returning to light cannot remove the old value", () => {
    values.set("theme", "dark");
    localStorage.removeItem.mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    expect(() => saveThemePreference("light")).not.toThrow();
    expect(values.get("theme")).toBe("dark");
  });

  test("supports a missing storage backend", () => {
    delete global.localStorage;

    expect(readThemePreference()).toBe("light");
    expect(() => saveThemePreference("dark")).not.toThrow();
    expect(() => saveThemePreference("light")).not.toThrow();
  });

  test("supports a storage backend whose getter throws", () => {
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Synthetic blocked storage");
      },
    });

    expect(readThemePreference()).toBe("light");
    expect(() => saveThemePreference("dark")).not.toThrow();
    expect(() => saveThemePreference("light")).not.toThrow();
  });
});
