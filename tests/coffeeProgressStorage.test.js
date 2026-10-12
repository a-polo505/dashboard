import {
  readCoffeeProgress,
  saveCoffeeProgress,
} from "../src/utils/coffeeProgressStorage.js";

const today = "Sat Oct 10 2026";
const yesterday = "Fri Oct 09 2026";
const cups = [true, true, false, false, false, false];

describe("coffee progress storage without DOM", () => {
  const originalStorage = global.localStorage;
  let values;

  beforeEach(() => {
    values = new Map();
    global.localStorage = {
      getItem: jest.fn((key) => values.get(key) ?? null),
      setItem: jest.fn((key, value) => values.set(key, String(value))),
    };
  });

  afterEach(() => {
    if (originalStorage === undefined) delete global.localStorage;
    else global.localStorage = originalStorage;
  });

  test("reads valid progress for the supplied date without rewriting storage", () => {
    values.set("coffeeCupsDate", today);
    values.set("coffeeCupsProgress", JSON.stringify(cups));

    expect(readCoffeeProgress(today, 6)).toEqual(cups);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test.each([null, yesterday, "invalid date"])(
    "ignores progress for a missing or different date (%s)",
    (date) => {
      if (date !== null) values.set("coffeeCupsDate", date);
      values.set("coffeeCupsProgress", JSON.stringify(cups));

      expect(readCoffeeProgress(today, 6)).toBeNull();
      expect(localStorage.getItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    },
  );

  test.each([
    null,
    "broken JSON",
    "null",
    "{}",
    "[]",
    "[true,false]",
    "[true,true,true,true,true,true,true]",
    "[1,0,0,0,0,0]",
  ])("rejects unusable saved progress (%s)", (progress) => {
    values.set("coffeeCupsDate", today);
    if (progress !== null) values.set("coffeeCupsProgress", progress);

    expect(readCoffeeProgress(today, 6)).toBeNull();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test.each(["coffeeCupsDate", "coffeeCupsProgress"])(
    "treats a read failure for %s as unavailable progress",
    (failedKey) => {
      values.set("coffeeCupsDate", today);
      localStorage.getItem.mockImplementation((key) => {
        if (key === failedKey) throw new Error("Synthetic storage failure");
        return values.get(key) ?? null;
      });

      expect(readCoffeeProgress(today, 6)).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    },
  );

  test("writes only coffee progress and date, in that order", () => {
    values.set("userCurrency", "EUR");

    saveCoffeeProgress(cups, today);

    expect(localStorage.setItem.mock.calls).toEqual([
      ["coffeeCupsProgress", JSON.stringify(cups)],
      ["coffeeCupsDate", today],
    ]);
    expect(values.get("userCurrency")).toBe("EUR");
    expect(readCoffeeProgress(today, 6)).toEqual(cups);
  });

  test("does not update the saved date when writing progress fails", () => {
    values.set("coffeeCupsDate", yesterday);
    values.set("coffeeCupsProgress", JSON.stringify(cups));
    localStorage.setItem.mockImplementation(() => {
      throw new Error("Synthetic quota failure");
    });

    expect(() => saveCoffeeProgress(Array(6).fill(false), today)).not.toThrow();
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(values.get("coffeeCupsDate")).toBe(yesterday);
    expect(values.get("coffeeCupsProgress")).toBe(JSON.stringify(cups));
  });

  test("handles a failed date write without throwing and keeps the previous date", () => {
    values.set("coffeeCupsDate", yesterday);
    localStorage.setItem.mockImplementation((key, value) => {
      if (key === "coffeeCupsDate")
        throw new Error("Synthetic storage failure");
      values.set(key, value);
    });

    expect(() => saveCoffeeProgress(cups, today)).not.toThrow();
    expect(values.get("coffeeCupsDate")).toBe(yesterday);
    expect(values.get("coffeeCupsProgress")).toBe(JSON.stringify(cups));
    expect(readCoffeeProgress(today, 6)).toBeNull();
  });
});
