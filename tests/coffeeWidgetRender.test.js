/** @jest-environment jsdom */

import { CoffeeWidgetRenderer } from "../src/components/widgets/coffeeWidget/coffeeWidgetRender.js";

describe("coffee widget progress recovery", () => {
  let renderer;
  const emptyProgress = Array(6).fill(false);
  const savedProgress = [true, true, false, false, false, false];

  function storeProgress(progress, date = new Date().toDateString()) {
    localStorage.setItem("coffeeCupsDate", date);
    if (progress !== null) localStorage.setItem("coffeeCupsProgress", progress);
  }

  function mountWidget() {
    document.body.appendChild(renderer.render());
    expect(document.querySelectorAll(".coffee-cup")).toHaveLength(6);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-10T12:00:00Z"));
    localStorage.clear();
    document.body.innerHTML = "";
    renderer = new CoffeeWidgetRenderer();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test.each([
    ["missing progress", null],
    ["empty string", ""],
    ["malformed JSON", "{invalid"],
    ["JSON null", "null"],
    ["object", "{}"],
    ["string", '"coffee"'],
    ["number", "6"],
    ["boolean", "true"],
    ["empty array", "[]"],
    ["short array", "[true,false]"],
    ["long array", "[true,true,true,true,true,true,true]"],
    ["non-boolean values", "[1,0,0,0,0,0]"],
    ["null entry", "[true,false,false,false,false,null]"],
    ["string entry", '[true,false,false,false,false,"false"]'],
  ])("recovers from %s and repairs only coffee storage", (name, progress) => {
    storeProgress(progress);
    localStorage.setItem("userCurrency", "EUR");
    localStorage.setItem("selectedDate", "2026-11-01");

    mountWidget();

    expect(renderer.cups).toEqual(emptyProgress);
    expect(localStorage.getItem("coffeeCupsDate")).toBe(
      new Date().toDateString(),
    );
    expect(JSON.parse(localStorage.getItem("coffeeCupsProgress"))).toEqual(
      emptyProgress,
    );
    expect(document.querySelector(".max-cups-text")).toBeNull();
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(localStorage.getItem("selectedDate")).toBe("2026-11-01");

    document.querySelectorAll(".coffee-cup")[1].click();
    expect(renderer.cups).toEqual(savedProgress);
  });

  test("preserves valid progress for today without rewriting storage", () => {
    storeProgress(JSON.stringify(savedProgress));
    const writes = jest.spyOn(window.Storage.prototype, "setItem");

    mountWidget();

    expect(renderer.cups).toEqual(savedProgress);
    expect(writes).not.toHaveBeenCalled();
  });

  test("preserves a full day and its maximum-cups message", () => {
    storeProgress(JSON.stringify(Array(6).fill(true)));

    mountWidget();
    jest.advanceTimersByTime(10);

    expect(renderer.cups).toEqual(Array(6).fill(true));
    expect(document.querySelector(".max-cups-text").textContent).toBe(
      "Take it easy, coffee lover!",
    );
    expect(document.querySelector(".max-cups-text").classList).toContain(
      "visible",
    );
  });

  test.each([0, 10])(
    "restores the maximum message after a rapid toggle and ignores a stale transition (%s ms)",
    (delay) => {
      storeProgress(JSON.stringify(Array(6).fill(true)));
      mountWidget();
      jest.advanceTimersByTime(delay);
      const message = document.querySelector(".max-cups-text");

      document.querySelectorAll(".coffee-cup")[5].click();
      expect(message.classList.contains("visible")).toBe(false);
      document.querySelectorAll(".coffee-cup")[5].click();

      expect(renderer.cups).toEqual(Array(6).fill(true));
      expect(document.querySelector(".max-cups-text")).toBe(message);
      expect(message.classList.contains("visible")).toBe(true);
      message.dispatchEvent(new Event("transitionend"));
      jest.advanceTimersByTime(10);
      expect(message.isConnected).toBe(true);
      expect(message.classList.contains("visible")).toBe(true);
      expect(document.querySelectorAll(".max-cups-text")).toHaveLength(1);
    },
  );

  test("keeps one message through repeated rapid toggles and removes it after a completed dismissal", () => {
    storeProgress(JSON.stringify(Array(6).fill(true)));
    mountWidget();
    jest.advanceTimersByTime(10);
    const message = document.querySelector(".max-cups-text");

    for (let cycle = 0; cycle < 3; cycle++) {
      document.querySelectorAll(".coffee-cup")[5].click();
      document.querySelectorAll(".coffee-cup")[5].click();
      message.dispatchEvent(new Event("transitionend"));
      expect(document.querySelector(".max-cups-text")).toBe(message);
      expect(message.classList.contains("visible")).toBe(true);
      expect(document.querySelectorAll(".max-cups-text")).toHaveLength(1);
    }

    document.querySelectorAll(".coffee-cup")[5].click();
    message.dispatchEvent(new Event("transitionend"));
    expect(message.isConnected).toBe(false);
    expect(document.querySelector(".max-cups-text")).toBeNull();

    document.querySelectorAll(".coffee-cup")[5].click();
    jest.advanceTimersByTime(10);
    const nextMessage = document.querySelector(".max-cups-text");
    expect(nextMessage).not.toBe(message);
    expect(nextMessage.classList.contains("visible")).toBe(true);
    expect(document.querySelectorAll(".max-cups-text")).toHaveLength(1);
  });

  test("does not show the delayed maximum message after a cup has already been cleared", () => {
    mountWidget();
    document.querySelectorAll(".coffee-cup")[5].click();
    const message = document.querySelector(".max-cups-text");
    document.querySelectorAll(".coffee-cup")[5].click();

    jest.advanceTimersByTime(10);

    expect(renderer.cups[5]).toBe(false);
    expect(message.classList.contains("visible")).toBe(false);
    document.querySelectorAll(".coffee-cup")[5].click();
    expect(message.classList.contains("visible")).toBe(true);
    expect(document.querySelectorAll(".max-cups-text")).toHaveLength(1);
  });

  test.each([null, "invalid date", "Fri Oct 09 2026", "Sun Oct 11 2026"])(
    "resets progress for a missing or different date (%s)",
    (date) => {
      localStorage.setItem("coffeeCupsProgress", JSON.stringify(savedProgress));
      if (date !== null) localStorage.setItem("coffeeCupsDate", date);

      mountWidget();

      expect(renderer.cups).toEqual(emptyProgress);
      expect(localStorage.getItem("coffeeCupsDate")).toBe(
        new Date().toDateString(),
      );
      expect(JSON.parse(localStorage.getItem("coffeeCupsProgress"))).toEqual(
        emptyProgress,
      );
    },
  );

  test("resets yesterday's progress before the first click of a new day", () => {
    storeProgress(JSON.stringify(Array(6).fill(true)));
    mountWidget();
    jest.setSystemTime(new Date("2026-10-11T12:00:00Z"));

    document.querySelector(".coffee-cup").click();

    expect(renderer.cups).toEqual([true, false, false, false, false, false]);
    expect(localStorage.getItem("coffeeCupsDate")).toBe(
      new Date().toDateString(),
    );
  });

  test("keeps the existing fill and clear interaction after recovery and reload", () => {
    storeProgress("{invalid");
    mountWidget();
    document.querySelectorAll(".coffee-cup")[3].click();
    document.querySelectorAll(".coffee-cup")[2].click();

    expect(renderer.cups).toEqual(savedProgress);
    document.body.innerHTML = "";
    renderer = new CoffeeWidgetRenderer();
    mountWidget();
    expect(renderer.cups).toEqual(savedProgress);
  });

  test.each(["coffeeCupsDate", "coffeeCupsProgress"])(
    "renders and remains interactive when reading %s fails",
    (key) => {
      storeProgress(JSON.stringify(savedProgress));
      const getItem = window.Storage.prototype.getItem;
      jest
        .spyOn(window.Storage.prototype, "getItem")
        .mockImplementation(function (name) {
          if (name === key) throw new Error("Storage unavailable");
          return getItem.call(this, name);
        });

      mountWidget();
      expect(renderer.cups).toEqual(emptyProgress);
      document.querySelectorAll(".coffee-cup")[1].click();
      expect(renderer.cups).toEqual(savedProgress);
    },
  );

  test.each(["coffeeCupsDate", "coffeeCupsProgress"])(
    "keeps recovered progress in memory when writing %s fails",
    (key) => {
      storeProgress("{invalid");
      const setItem = window.Storage.prototype.setItem;
      jest
        .spyOn(window.Storage.prototype, "setItem")
        .mockImplementation(function (name, value) {
          if (name === key) throw new Error("Storage unavailable");
          return setItem.call(this, name, value);
        });

      mountWidget();
      expect(renderer.cups).toEqual(emptyProgress);
      document.querySelectorAll(".coffee-cup")[1].click();
      expect(renderer.cups).toEqual(savedProgress);
      document.querySelector(".coffee-cup").click();
      expect(renderer.cups).toEqual(emptyProgress);
    },
  );

  test("does not mark yesterday's progress as current if resetting it cannot be saved", () => {
    storeProgress(JSON.stringify(savedProgress), "Fri Oct 09 2026");
    const setItem = window.Storage.prototype.setItem;
    jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(function (key, value) {
        if (key === "coffeeCupsProgress") throw new Error("Storage full");
        return setItem.call(this, key, value);
      });

    mountWidget();

    expect(renderer.cups).toEqual(emptyProgress);
    expect(localStorage.getItem("coffeeCupsDate")).toBe("Fri Oct 09 2026");
  });

  test("remains interactive when both storage reads and writes are blocked", () => {
    jest.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    mountWidget();
    document.querySelectorAll(".coffee-cup")[1].click();

    expect(renderer.cups).toEqual(savedProgress);
    document.querySelector(".coffee-cup").click();
    expect(renderer.cups).toEqual(emptyProgress);
  });

  test("preserves loaded progress when a subsequent save fails", () => {
    storeProgress(JSON.stringify(savedProgress));
    mountWidget();
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });

    document.querySelectorAll(".coffee-cup")[2].click();

    expect(renderer.cups).toEqual([true, true, true, false, false, false]);
    expect(JSON.parse(localStorage.getItem("coffeeCupsProgress"))).toEqual(
      savedProgress,
    );
  });
});
