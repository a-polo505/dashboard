/** @jest-environment jsdom */

const rates = {
  currencies: [
    {
      data: {
        USD: { code: "USD", value: 1 },
        UAH: { code: "UAH", value: 41 },
        EUR: { code: "EUR", value: 0.9 },
      },
    },
  ],
  currenciesDiff: [
    {
      data: { UAH: { code: "UAH", value: 40 }, EUR: { code: "EUR", value: 1 } },
    },
  ],
};

describe("grid editing with real widgets and mocked network", () => {
  const originalFetch = global.fetch;
  const originalObserver = Object.getOwnPropertyDescriptor(
    window,
    "IntersectionObserver",
  );
  const originalMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  let editor;
  let widgets;
  let documentAdd;
  let windowAdd;
  let loadCurrencyWidget;
  const button = (id) => document.getElementById(id);
  const begin = () => button("customizeButton").click();
  const cancel = () => button("cancelCustomizationButton").click();

  function hover(element) {
    const event = new window.MouseEvent("pointerover", {
      bubbles: true,
      clientX: 20,
      clientY: 30,
    });
    Object.defineProperty(event, "pointerType", { value: "mouse" });
    element.dispatchEvent(event);
  }

  beforeEach(() => {
    window.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
    jest.resetModules();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 14, 12));
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML =
      '<header><div id="gridEditor" hidden></div></header><div id="app" class="widgets"></div><div id="contextMenuContainer"></div>';
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn((query) => ({
        matches:
          query !== "(any-pointer: coarse)" &&
          query !== "(prefers-reduced-motion: reduce)",
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => rates });
    documentAdd = jest.spyOn(document, "addEventListener");
    windowAdd = jest.spyOn(window, "addEventListener");
    const { initializeWidgets } = jest.requireActual(
      "../src/utils/widgetInitializer.js",
    );
    const { initializeGridEditor } = jest.requireActual(
      "../src/components/ui/gridEditor/gridEditor.js",
    );
    const { closeWidgetOverlays } = jest.requireActual(
      "../src/utils/widgetOverlays.js",
    );
    ({ loadCurrencyWidget } = jest.requireActual(
      "../src/components/widgets/currencyWidget/currencyWidget.js",
    ));
    widgets = initializeWidgets().widgets;
    editor = initializeGridEditor(widgets, {
      grid: button("app"),
      toolbar: button("gridEditor"),
      beforeEdit: () => closeWidgetOverlays(widgets),
    });
  });

  afterEach(() => {
    for (const node of document.querySelectorAll(".button-select-day"))
      node._flatpickr?.destroy();
    editor.destroy();
    jest
      .requireActual("../src/utils/widgetOverlays.js")
      .closeWidgetOverlays(widgets);
    for (const [type, listener, options] of documentAdd.mock.calls)
      document.removeEventListener(type, listener, options);
    for (const [type, listener, options] of windowAdd.mock.calls)
      window.removeEventListener(type, listener, options);
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    if (originalObserver)
      Object.defineProperty(window, "IntersectionObserver", originalObserver);
    else delete window.IntersectionObserver;
    document.body.replaceChildren();
    if (originalMedia)
      Object.defineProperty(window, "matchMedia", originalMedia);
    else delete window.matchMedia;
    if (originalFetch === undefined) delete global.fetch;
    else global.fetch = originalFetch;
  });

  test.each(["tooltip", "currency menu", "date picker"])(
    "closes an open %s before editing and preserves its interactions after cancel",
    async (kind) => {
      await loadCurrencyWidget();
      const show = {
        tooltip: () => hover(document.querySelector(".date--day")),
        "currency menu": () => button("currencyPair").click(),
        "date picker": () =>
          document.querySelector(".button-select-day").click(),
      };
      const selectors = {
        tooltip: ".tooltip",
        "currency menu": "#contextMenu",
        "date picker": ".flatpickr-calendar.open",
      };
      show[kind]();
      expect(document.querySelector(selectors[kind])).not.toBeNull();
      begin();

      expect(document.querySelector(".tooltip")).toBeNull();
      expect(document.querySelector("#contextMenu")).toBeNull();
      expect(document.querySelector(".flatpickr-calendar.open")).toBeNull();
      expect(document.querySelector(".animation-circle")).toBeNull();
      show[kind]();
      jest.advanceTimersByTime(20);
      expect(document.querySelector(selectors[kind])).toBeNull();
      cancel();
      show[kind]();
      expect(document.querySelector(selectors[kind])).not.toBeNull();
    },
  );

  test("retains removal controls and inert content after delayed currency loading", async () => {
    let finish;
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const loading = loadCurrencyWidget();
    const currency = button("currencyWidget");
    begin();
    const remove = document.querySelector('[data-remove-widget="currency"]');
    remove.click();
    finish({ ok: true, json: async () => rates });
    await loading;

    expect(currency.hasAttribute("inert")).toBe(true);
    expect(remove.isConnected).toBe(true);
    expect(currency.closest(".grid-widget").hidden).toBe(true);
    button("addWidgetButton").click();
    const restore = [
      ...button("addWidgetMenu").querySelectorAll("button"),
    ].find((node) => node.textContent === "Currency rates");
    restore.click();
    expect(currency.parentElement.hidden).toBe(false);
    button("currencyPair").click();
    expect(document.querySelector("#contextMenu")).toBeNull();
    cancel();
    expect(button("currencyWidget")).toBe(currency);
    button("currencyPair").click();
    expect(document.querySelector("#contextMenu")).not.toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("uses current display names to restore stable IDs from an existing saved layout", () => {
    const expected = [
      ["contact", "Contact Author"],
      ["coffee", "Coffee Tracker"],
      ["calendar", "Calendar"],
      ["bookmarks", "Bookmarks"],
      ["music", "Music"],
      ["countdown", "Countdown"],
      ["quote", "Quote"],
      ["air", "Fresh Air"],
      ["weeks", "Year Progress"],
      ["time", "Day Progress"],
      ["date", "Current Date"],
    ];
    const savedIds = [
      "contact",
      "coffee",
      "calendar",
      "bookmarks",
      "music",
      "countdown",
      "quote",
      "air",
      "currency",
      "weeks",
      "time",
      "date",
    ];
    const snapshot = {
      version: 1,
      widgets: savedIds.map((id) => ({ id, is_remove: id !== "currency" })),
    };
    const raw = JSON.stringify(snapshot);
    editor.destroy();
    localStorage.setItem("dashboardLayout", raw);
    const { initializeGridEditor } = jest.requireActual(
      "../src/components/ui/gridEditor/gridEditor.js",
    );
    const grid = button("app");
    editor = initializeGridEditor(widgets, {
      grid,
      toolbar: button("gridEditor"),
    });
    const visibleIds = () =>
      [...grid.children]
        .filter((node) => !node.hidden)
        .map((node) => node.dataset.widgetId);

    expect(visibleIds()).toEqual(["currency", "clock"]);
    expect([...grid.children].map((node) => node.dataset.widgetId)).toEqual([
      ...savedIds,
      "clock",
    ]);
    begin();
    expect(
      [...button("addWidgetMenu").querySelectorAll("button")].map(
        (node) => node.textContent,
      ),
    ).toEqual(expected.map(([, name]) => name));

    for (const [id, name] of expected) {
      button("addWidgetButton").click();
      const option = [
        ...button("addWidgetMenu").querySelectorAll("button"),
      ].find((node) => node.textContent === name);
      option.click();
      const original = widgets.find((widget) => widget.id === id).container;
      expect(original.closest(".grid-widget").hidden).toBe(false);
    }
    expect(visibleIds()).toEqual([...savedIds, "clock"]);
    expect(grid.querySelectorAll(".Container")).toHaveLength(13);
    expect(new Set(widgets.map(({ container }) => container)).size).toBe(13);
    expect(localStorage.getItem("dashboardLayout")).toBe(raw);
    cancel();
    expect(visibleIds()).toEqual(["currency", "clock"]);
    expect(localStorage.getItem("dashboardLayout")).toBe(raw);

    begin();
    button("addWidgetButton").click();
    button("addWidgetMenu").querySelector("button").click();
    button("saveLayoutButton").click();
    expect(visibleIds()).toEqual(["contact", "currency", "clock"]);
    expect(JSON.parse(localStorage.getItem("dashboardLayout"))).toEqual({
      version: 1,
      widgets: [
        ...snapshot.widgets.map((entry) => ({
          ...entry,
          is_remove: entry.id === "contact" ? false : entry.is_remove,
        })),
        { id: "clock", is_remove: false },
      ],
    });
    expect(new Set(grid.children)).toEqual(
      new Set(widgets.map(({ container }) => container)),
    );
  });

  test("hides and restores Clock without replacing its artwork or affecting Day Progress", () => {
    const clock = widgets.find(({ id }) => id === "clock").container;
    const face = clock.querySelector(".clock__face");
    const time = widgets.find(({ id }) => id === "time").container;
    begin();
    document.querySelector('[data-remove-widget="clock"]').click();
    expect(clock.closest(".grid-widget").hidden).toBe(true);
    button("addWidgetButton").click();
    [...button("addWidgetMenu").querySelectorAll("button")]
      .find((node) => node.textContent === "Clock")
      .click();
    expect(clock.closest(".grid-widget").hidden).toBe(false);
    expect(clock.querySelector(".clock__face")).toBe(face);
    button("saveLayoutButton").click();
    expect(clock.parentElement).toBe(button("app"));
    expect(time.querySelector("#progress-circle")).not.toBeNull();
    expect(
      button("app").querySelectorAll('[data-widget-id="clock"]'),
    ).toHaveLength(1);
  });

  test("retains edit controls and blocks fresh tooltip subscriptions after the time widget refreshes", () => {
    begin();
    const time = widgets.find((widget) => widget.id === "time").container;
    const oldPath = time.querySelector("path");
    const remove = document.querySelector('[data-remove-widget="time"]');
    jest.advanceTimersByTime(5 * 60 * 1000);
    const currentPath = time.querySelector("path");

    expect(currentPath).not.toBe(oldPath);
    expect(remove.isConnected).toBe(true);
    expect(time.hasAttribute("inert")).toBe(true);
    hover(currentPath);
    expect(document.querySelector(".tooltip")).toBeNull();
    cancel();
    hover(currentPath);
    expect(document.querySelector(".tooltip")).not.toBeNull();
  });

  test("keeps widget preference keys intact and preserves coffee interactions after save", async () => {
    await loadCurrencyWidget();
    document.querySelector(".coffee-cup").click();
    const cup = document.querySelector(".coffee-cup");
    const progress = localStorage.getItem("coffeeCupsProgress");
    const coffeeDate = localStorage.getItem("coffeeCupsDate");
    localStorage.setItem("selectedDate", "2026-10-20");
    localStorage.setItem("userCurrency", "EUR");
    localStorage.setItem("theme", "dark");
    begin();
    cup.click();
    document.querySelector('[data-remove-widget="quote"]').click();
    button("saveLayoutButton").click();

    expect(localStorage.getItem("coffeeCupsProgress")).toBe(progress);
    expect(localStorage.getItem("coffeeCupsDate")).toBe(coffeeDate);
    expect(localStorage.getItem("selectedDate")).toBe("2026-10-20");
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.querySelector(".coffee-cup")).toBe(cup);
    cup.click();
    expect(localStorage.getItem("coffeeCupsProgress")).not.toBe(progress);
  });
});
