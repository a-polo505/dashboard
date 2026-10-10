/** @jest-environment jsdom */

import flatpickr from "flatpickr";
import { DateCountdownRenderer } from "../src/components/widgets/dateCountdownWidget/dateCountdownWidgetRender.js";

jest.mock("flatpickr", () => jest.fn());

describe("date countdown recovery", () => {
  let renderer;
  const prompt = "Choose your special day to count down! 🥳";

  function mountWidget() {
    document.body.appendChild(renderer.render());
  }

  function expectInitialDisplay() {
    expect(document.getElementById("selected-date").textContent).toBe(prompt);
    expect(document.getElementById("selected-text").textContent).toBe("");
    expect(document.body.textContent).not.toContain("NaN");
  }

  function openPicker() {
    document.querySelector(".button-select-day").click();
    return flatpickr.mock.calls.at(-1)[1];
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 10, 12));
    document.body.innerHTML = "";
    localStorage.clear();
    flatpickr.mockReset();
    renderer = new DateCountdownRenderer();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.flatpickr;
  });

  test.each([
    "",
    "invalid",
    "null",
    "{}",
    "2026-10-11T00:00:00Z",
    "10/11/2026",
    "2026-1-1",
    " 2026-10-11 ",
    "2026-13-01",
    "2026-00-11",
    "2026-10-00",
    "2026-10-32",
    "2027-02-29",
    "2027-02-30",
    "2027-04-31",
    "2026-10-09",
    "2026-10-10",
  ])("removes unusable stored date %s and opens an empty picker", (date) => {
    localStorage.setItem("selectedDate", date);
    localStorage.setItem("userCurrency", "EUR");

    mountWidget();

    expectInitialDisplay();
    expect(localStorage.getItem("selectedDate")).toBeNull();
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(openPicker().defaultDate).toBeNull();
  });

  test("keeps the initial state with no saved date", () => {
    mountWidget();

    expectInitialDisplay();
    expect(openPicker().defaultDate).toBeNull();
  });

  test("restores a valid future date using local calendar components", () => {
    localStorage.setItem("selectedDate", "2026-10-11");
    const writes = jest.spyOn(window.Storage.prototype, "setItem");

    mountWidget();

    expect(document.getElementById("selected-date").textContent).toBe("1");
    expect(document.getElementById("selected-text").textContent).toBe(
      "Days Left",
    );
    const date = openPicker().defaultDate;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(11);
    expect(date.getHours()).toBe(0);
    expect(localStorage.getItem("selectedDate")).toBe("2026-10-11");
    expect(writes).not.toHaveBeenCalled();
  });

  test("accepts an existing leap day", () => {
    localStorage.setItem("selectedDate", "2028-02-29");

    mountWidget();

    const date = openPicker().defaultDate;
    expect(date.getFullYear()).toBe(2028);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(29);
    expect(document.body.textContent).not.toContain("NaN");
  });

  test("restores an exact calendar count across the autumn clock change", () => {
    jest.setSystemTime(new Date(2026, 9, 24, 12));
    localStorage.setItem("selectedDate", "2026-10-26");

    mountWidget();

    expect(document.getElementById("selected-date").textContent).toBe("2");
    expect(localStorage.getItem("selectedDate")).toBe("2026-10-26");
    expect(openPicker().defaultDate.getDate()).toBe(26);
  });

  test("counts a newly selected date across the spring clock change", () => {
    jest.setSystemTime(new Date(2026, 2, 28, 12));
    mountWidget();
    const instance = { close: jest.fn() };

    openPicker().onChange([new Date(2026, 2, 30)], "2026-03-30", instance);

    expect(document.getElementById("selected-date").textContent).toBe("2");
    expect(localStorage.getItem("selectedDate")).toBe("2026-03-30");
    expect(instance.close).toHaveBeenCalledTimes(1);
  });

  test("allows selection after recovery and restores it after reload", () => {
    localStorage.setItem("selectedDate", "invalid");
    mountWidget();
    const options = openPicker();
    const instance = { close: jest.fn(), open: jest.fn() };

    options.onReady([], "", instance);
    expect(instance.open).toHaveBeenCalledTimes(1);
    options.onChange([new Date(2026, 9, 12)], "2026-10-12", instance);

    expect(document.getElementById("selected-date").textContent).toBe("2");
    expect(localStorage.getItem("selectedDate")).toBe("2026-10-12");
    expect(instance.close).toHaveBeenCalledTimes(1);
    document.body.innerHTML = "";
    renderer = new DateCountdownRenderer();
    mountWidget();
    expect(document.getElementById("selected-date").textContent).toBe("2");
  });

  test.each(["", "invalid", "2027-02-30", "2026-10-09", "2026-10-10"])(
    "clears unusable picker selection %s without displaying NaN",
    (date) => {
      localStorage.setItem("selectedDate", "2026-10-12");
      mountWidget();
      const options = openPicker();
      const instance = { close: jest.fn() };

      options.onChange([], date, instance);

      expectInitialDisplay();
      expect(localStorage.getItem("selectedDate")).toBeNull();
      expect(instance.close).toHaveBeenCalledTimes(1);
    },
  );

  test("expires a restored date before reopening the picker on a later day", () => {
    localStorage.setItem("selectedDate", "2026-10-11");
    mountWidget();
    jest.setSystemTime(new Date(2026, 9, 11, 12));

    expect(openPicker().defaultDate).toBeNull();
    expectInitialDisplay();
    expect(localStorage.getItem("selectedDate")).toBeNull();
  });

  test("recovers when removing an invalid value fails", () => {
    localStorage.setItem("selectedDate", "invalid");
    jest
      .spyOn(window.Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

    mountWidget();

    expectInitialDisplay();
    expect(openPicker().defaultDate).toBeNull();
  });

  test("keeps the picker and display usable when storage reads and writes fail", () => {
    jest.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    mountWidget();
    expectInitialDisplay();
    const instance = { close: jest.fn() };

    openPicker().onChange([new Date(2026, 9, 12)], "2026-10-12", instance);

    expect(document.getElementById("selected-date").textContent).toBe("2");
    expect(instance.close).toHaveBeenCalledTimes(1);
    expect(openPicker().defaultDate.getDate()).toBe(12);
  });

  test("keeps the new date in memory when writing fails but reading still works", () => {
    localStorage.setItem("selectedDate", "2026-10-11");
    mountWidget();
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });

    openPicker().onChange([new Date(2026, 9, 12)], "2026-10-12", {
      close: jest.fn(),
    });

    expect(document.getElementById("selected-date").textContent).toBe("2");
    expect(openPicker().defaultDate.getDate()).toBe(12);
    expect(localStorage.getItem("selectedDate")).toBe("2026-10-11");
  });

  test("selects a new date with the imported flatpickr without a browser global", () => {
    flatpickr.mockImplementation(jest.requireActual("flatpickr"));
    delete global.flatpickr;
    expect(window.flatpickr).toBeUndefined();
    localStorage.setItem("selectedDate", "invalid");
    mountWidget();
    const button = document.querySelector(".button-select-day");
    button.click();
    const picker = button._flatpickr;

    try {
      expect(picker.isOpen).toBe(true);
      document
        .querySelector('.flatpickr-day[aria-label="October 12, 2026"]')
        .click();

      expect(document.getElementById("selected-date").textContent).toBe("2");
      expect(localStorage.getItem("selectedDate")).toBe("2026-10-12");
      expect(picker.isOpen).toBe(false);
    } finally {
      picker.destroy();
    }
  });

  test("restores the saved date in the imported picker without a browser global", () => {
    flatpickr.mockImplementation(jest.requireActual("flatpickr"));
    delete global.flatpickr;
    expect(window.flatpickr).toBeUndefined();
    localStorage.setItem("selectedDate", "2026-10-12");
    mountWidget();
    const button = document.querySelector(".button-select-day");
    button.click();
    const picker = button._flatpickr;

    try {
      expect(picker.isOpen).toBe(true);
      expect(picker.selectedDates).toHaveLength(1);
      expect(picker.formatDate(picker.selectedDates[0], "Y-m-d")).toBe(
        "2026-10-12",
      );
      expect(document.getElementById("selected-date").textContent).toBe("2");
      expect(localStorage.getItem("selectedDate")).toBe("2026-10-12");
    } finally {
      picker.destroy();
    }
  });
});
