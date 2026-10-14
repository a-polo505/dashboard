/** @jest-environment jsdom */

describe("explicit widget initialization", () => {
  let initializeWidgets;
  let documentEvents;
  let windowEvents;
  let elementEvents;
  let interval;
  const originalFetch = global.fetch;

  const widgetIds = [
    "date",
    "time",
    "weeks",
    "currency",
    "air",
    "quote",
    "countdown",
    "music",
    "bookmarks",
    "calendar",
    "coffee",
    "contact",
  ];
  const widgetClasses = [
    "date-widget-container",
    "time-widget-container",
    "weeks-widget-container",
    "currency-widget-container",
    "air-widget-container",
    "quote-widget-container",
    "datecount-widget-container",
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
    sessionStorage.clear();
    global.fetch = jest.fn();
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
    if (originalFetch === undefined) delete global.fetch;
    else global.fetch = originalFetch;
  });

  test("import does not mount widgets, write storage, or start timers and listeners", () => {
    expect(document.querySelector(".widgets").children).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    expect(documentEvents).not.toHaveBeenCalled();
    expect(windowEvents).not.toHaveBeenCalled();
    expect(elementEvents).not.toHaveBeenCalled();
  });

  test("mounts and registers all 12 widgets in their existing visual order without loading rates", () => {
    const dashboard = initializeWidgets();
    const containers = [...document.querySelector(".widgets").children];

    expect(dashboard.widgets).toHaveLength(12);
    expect(containers).toHaveLength(widgetClasses.length);
    expect(dashboard.widgets.map((widget) => widget.id)).toEqual(widgetIds);
    expect(containers.map((container) => container.dataset.widgetId)).toEqual(
      widgetIds,
    );
    expect(dashboard.widgets.map((widget) => widget.container)).toEqual(
      containers,
    );
    expect(new Set(dashboard.widgets.map((widget) => widget.name)).size).toBe(
      12,
    );
    expect(
      Object.fromEntries(dashboard.widgets.map(({ id, name }) => [id, name])),
    ).toEqual({
      date: "Current Date",
      time: "Day Progress",
      weeks: "Year Progress",
      currency: "Currency rates",
      air: "Fresh Air",
      quote: "Quote",
      countdown: "Countdown",
      music: "Music",
      bookmarks: "Bookmarks",
      calendar: "Calendar",
      coffee: "Coffee Tracker",
      contact: "Contact Author",
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(document.getElementById("loadingSpinner")).not.toBeNull();
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
    expect(first.widgets).toHaveLength(12);
    expect(interval).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(timerCount);
    expect(documentEvents).toHaveBeenCalledTimes(documentEventCount);
    expect(windowEvents).toHaveBeenCalledTimes(windowEventCount);
    expect(elementEvents).toHaveBeenCalledTimes(elementEventCount);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      documentEvents.mock.calls.filter(([type]) => type === "currencyChange"),
    ).toHaveLength(1);
  });

  test.each([
    ["success", "#currencyPair", "USD / UAH"],
    [
      "failure",
      '[role="alert"]',
      "Currency rates are unavailable. Please try again.",
    ],
  ])(
    "keeps all registered containers and their order during a slow currency request ending in %s",
    async (outcome, resultSelector, expectedText) => {
      const dashboard = initializeWidgets();
      const containers = dashboard.widgets.map((widget) => widget.container);
      const currency = dashboard.widgets.find(
        (widget) => widget.id === "currency",
      );
      const { loadCurrencyWidget } = jest.requireActual(
        "../src/components/widgets/currencyWidget/currencyWidget.js",
      );
      let resolveRequest;
      let rejectRequest;
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            resolveRequest = resolve;
            rejectRequest = reject;
          }),
      );
      jest.spyOn(console, "error").mockImplementation(() => {});

      const loading = loadCurrencyWidget();

      expect([...document.querySelector(".widgets").children]).toEqual(
        containers,
      );
      expect(
        currency.container.querySelector("#loadingSpinner"),
      ).not.toBeNull();
      expect(document.querySelectorAll(".coffee-cup")).toHaveLength(6);
      expect(initializeWidgets()).toBe(dashboard);

      if (outcome === "success") {
        resolveRequest({
          ok: true,
          json: async () => ({
            currencies: [
              {
                data: {
                  USD: { code: "USD", value: 1 },
                  UAH: { code: "UAH", value: 41 },
                },
              },
            ],
            currenciesDiff: [],
          }),
        });
      } else {
        rejectRequest(new Error("Synthetic currency failure"));
      }
      await loading;

      expect([...document.querySelector(".widgets").children]).toEqual(
        containers,
      );
      expect(dashboard.widgets.find((widget) => widget.id === "currency")).toBe(
        currency,
      );
      expect(currency.container.querySelector("#loadingSpinner")).toBeNull();
      expect(currency.container.querySelector(resultSelector).textContent).toBe(
        expectedText,
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(
        interval.mock.calls.filter(([, delay]) => delay === 60 * 60 * 1000),
      ).toHaveLength(1);
    },
  );

  test("rejects a missing parent before side effects and permits initialization after mounting it", () => {
    document.body.innerHTML = "";

    expect(initializeWidgets).toThrow("Widget parent element not found");
    expect(document.body.children).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    expect(elementEvents).not.toHaveBeenCalled();

    document.body.innerHTML = '<div class="widgets"></div>';
    expect(initializeWidgets().widgets).toHaveLength(12);
  });

  test("keeps the time widget refresh working without replacing its container", () => {
    jest.setSystemTime(new Date(2026, 9, 10, 18, 0));
    initializeWidgets();
    const container = document.querySelector(".time-widget-container");
    const firstContent = container.firstElementChild;
    const firstPath = container.querySelector("path");
    const hover = (path) => {
      const event = new window.MouseEvent("pointerover", { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: "mouse" });
      path.dispatchEvent(event);
    };
    expect(container.querySelector("#svgText").textContent).toBe("75.00%");
    hover(firstPath);
    expect(document.querySelector(".tooltip").textContent).toBe(
      "Remaining time until end of day: 25.00%",
    );

    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(document.querySelector(".time-widget-container")).toBe(container);
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).not.toBe(firstContent);
    expect(container.querySelector("#svgText").textContent).toBe("75.35%");
    expect(document.querySelector(".tooltip")).toBeNull();
    hover(firstPath);
    expect(document.querySelector(".tooltip")).toBeNull();
    hover(container.querySelector("path"));
    expect(document.querySelector(".tooltip").textContent).toBe(
      "Remaining time until end of day: 24.65%",
    );
    expect(document.querySelector(".widgets").children).toHaveLength(12);
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

    expect(dashboard.widgets).toHaveLength(12);
    expect(document.querySelectorAll(".coffee-cup")).toHaveLength(6);
    expect(
      document.querySelector(".contact-author-widget-container"),
    ).not.toBeNull();
    expect(initializeWidgets()).toBe(dashboard);
  });

  test("starts all widgets with an invalid saved countdown date", () => {
    localStorage.setItem("selectedDate", "invalid");

    expect(initializeWidgets().widgets).toHaveLength(12);
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
