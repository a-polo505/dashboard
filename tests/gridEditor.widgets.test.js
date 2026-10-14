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
  const originalMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  let editor;
  let widgets;
  let documentAdd;
  let windowAdd;
  let loadCurrencyWidget;
  const button = (id) => document.getElementById(id);
  const begin = () => button("grid_edit_btn").click();
  const cancel = () => button("grid_edit_cancel_btn").click();

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
    button("grid_edit_add_btn").click();
    const restore = [
      ...button("grid_edit_add_menu").querySelectorAll("button"),
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
    button("grid_edit_save_btn").click();

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
