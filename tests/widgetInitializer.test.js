/** @jest-environment jsdom */

describe("explicit widget initialization", () => {
  let initializeWidgets;
  let documentEvents;
  let windowEvents;
  let elementEvents;
  let interval;

  const widgetClasses = [
    "air-widget-container",
    "date-widget-container",
    "weeks-widget-container",
    "time-widget-container",
    "datecount-widget-container",
    "quote-widget-container",
    "music-widget-container",
    "bookmarks-widget-container",
    "calendar-widget-container",
    "coffe-widget-container",
    "contact-author-widget-container",
  ];

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-10T12:00:00Z"));
    document.body.innerHTML = '<div class="widgets"></div>';
    localStorage.clear();
    documentEvents = jest.spyOn(document, "addEventListener");
    windowEvents = jest.spyOn(window, "addEventListener");
    elementEvents = jest.spyOn(window.Element.prototype, "addEventListener");
    interval = jest.spyOn(global, "setInterval");
    ({ initializeWidgets } = jest.requireActual(
      "../src/utils/widgetInitializer.js",
    ));
  });

  afterEach(() => {
    for (const [type, listener, options] of documentEvents.mock.calls) {
      document.removeEventListener(type, listener, options);
    }
    for (const [type, listener, options] of windowEvents.mock.calls) {
      window.removeEventListener(type, listener, options);
    }
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("import does not mount widgets, write storage, or start timers and listeners", () => {
    expect(document.querySelector(".widgets").children).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    expect(documentEvents).not.toHaveBeenCalled();
    expect(windowEvents).not.toHaveBeenCalled();
    expect(elementEvents).not.toHaveBeenCalled();
  });

  test("mounts all existing widgets in their original order", () => {
    const dashboard = initializeWidgets();
    const containers = [...document.querySelector(".widgets").children];

    expect(dashboard.widgets).toHaveLength(11);
    expect(containers).toHaveLength(widgetClasses.length);
    for (const [index, container] of containers.entries()) {
      expect(container.classList.contains(widgetClasses[index])).toBe(true);
      expect(container.classList.contains("Container--small")).toBe(true);
      expect(container.children.length).toBeGreaterThan(0);
    }
    expect(interval).toHaveBeenCalledTimes(1);
    expect(interval).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
  });

  test("repeated initialization reuses widgets without adding timers or listeners", () => {
    const first = initializeWidgets();
    const containers = [...document.querySelector(".widgets").children];
    const documentEventCount = documentEvents.mock.calls.length;
    const windowEventCount = windowEvents.mock.calls.length;
    const elementEventCount = elementEvents.mock.calls.length;
    const timerCount = jest.getTimerCount();

    expect(initializeWidgets()).toBe(first);
    expect(initializeWidgets()).toBe(first);
    expect([...document.querySelector(".widgets").children]).toEqual(
      containers,
    );
    expect(first.widgets).toHaveLength(11);
    expect(interval).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(timerCount);
    expect(documentEvents).toHaveBeenCalledTimes(documentEventCount);
    expect(windowEvents).toHaveBeenCalledTimes(windowEventCount);
    expect(elementEvents).toHaveBeenCalledTimes(elementEventCount);
  });

  test("rejects a missing parent before side effects and permits initialization after mounting it", () => {
    document.body.innerHTML = "";

    expect(initializeWidgets).toThrow("Widget parent element not found");
    expect(document.body.children).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    expect(elementEvents).not.toHaveBeenCalled();

    document.body.innerHTML = '<div class="widgets"></div>';
    expect(initializeWidgets().widgets).toHaveLength(11);
  });

  test("keeps the time widget refresh working without replacing its container", () => {
    initializeWidgets();
    const container = document.querySelector(".time-widget-container");
    const firstContent = container.firstElementChild;

    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(document.querySelector(".time-widget-container")).toBe(container);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).not.toBe(firstContent);
    expect(document.querySelector(".widgets").children).toHaveLength(11);
    expect(interval).toHaveBeenCalledTimes(1);
  });

  test("keeps coffee interaction and stored progress after repeated initialization", () => {
    initializeWidgets();
    initializeWidgets();

    document.querySelector(".coffee-cup").click();

    expect(JSON.parse(localStorage.getItem("coffeeCupsProgress"))).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(document.querySelectorAll(".coffee-cup")).toHaveLength(6);
  });

  test("continues startup past coffee when its saved progress is corrupted", () => {
    localStorage.setItem("coffeeCupsDate", new Date().toDateString());
    localStorage.setItem("coffeeCupsProgress", "{invalid");

    const dashboard = initializeWidgets();

    expect(dashboard.widgets).toHaveLength(11);
    expect(document.querySelectorAll(".coffee-cup")).toHaveLength(6);
    expect(
      document.querySelector(".contact-author-widget-container"),
    ).not.toBeNull();
    expect(initializeWidgets()).toBe(dashboard);
  });

  test("starts all widgets with an invalid saved countdown date", () => {
    localStorage.setItem("selectedDate", "invalid");

    expect(initializeWidgets().widgets).toHaveLength(11);
    expect(
      document.querySelector(".datecount-widget-container").textContent,
    ).not.toContain("NaN");
    expect(localStorage.getItem("selectedDate")).toBeNull();
    expect(document.querySelectorAll(".coffee-cup")).toHaveLength(6);
    expect(
      document.querySelector(".contact-author-widget-container"),
    ).not.toBeNull();
  });
});
