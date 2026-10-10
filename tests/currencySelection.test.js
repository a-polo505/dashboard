/** @jest-environment jsdom */

const initial = {
  currencies: [
    {
      lastUpdated: "2026-10-10T09:00:00.000Z",
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
const refreshed = {
  currencies: [
    {
      lastUpdated: "2026-10-11T09:00:00.000Z",
      data: {
        USD: { code: "USD", value: 1 },
        UAH: { code: "UAH", value: 42 },
        EUR: { code: "EUR", value: 0.8 },
        GBP: { code: "GBP", value: 0.7 },
      },
    },
  ],
  currenciesDiff: initial.currencies,
};

describe("currency selection without required browser storage", () => {
  const originalFetch = global.fetch;
  let initialize;
  let refresh;
  let display;
  let menu;
  let documentAdd;
  let touchDescriptor;
  let pointsDescriptor;

  function saveCache(data = initial) {
    sessionStorage.setItem("currencies", JSON.stringify(data.currencies));
    sessionStorage.setItem(
      "currenciesDiff",
      JSON.stringify(data.currenciesDiff),
    );
  }

  function openMenu() {
    document.getElementById("currencyPair").click();
  }
  function menuCodes() {
    return Array.from(
      document.querySelectorAll("#contextMenu li button"),
      (button) => button.textContent,
    );
  }
  function select(code) {
    const button = Array.from(
      document.querySelectorAll("#contextMenu li button"),
    ).find((item) => item.textContent === code);
    expect(button).toBeDefined();
    button.click();
  }
  function expectRate(code, value) {
    expect(document.getElementById("currencyPair").textContent).toBe(
      `USD / ${code}`,
    );
    expect(document.getElementById("rate").textContent).toBe(String(value));
  }
  function expectUpdated(data) {
    document
      .getElementById("percentageChange")
      .dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true }));
    const text = document.querySelector(".tooltip").textContent;
    expect(text).toBe(
      `Last updated: ${new Date(data.currencies[0].lastUpdated).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        },
      )}`,
    );
    window.dispatchEvent(new Event("scroll"));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    document.body.innerHTML =
      '<div class="widgets"></div><div id="contextMenuContainer"></div>';
    sessionStorage.clear();
    localStorage.clear();
    touchDescriptor = Object.getOwnPropertyDescriptor(window, "ontouchstart");
    pointsDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "maxTouchPoints",
    );
    delete window.ontouchstart;
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    documentAdd = jest.spyOn(document, "addEventListener");
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => initial });
    ({ initializeCurrencyWidget: initialize } = jest.requireActual(
      "../src/components/widgets/currencyWidget/currencyWidget.js",
    ));
    ({ fetchAndUpdateData: refresh } = jest.requireActual(
      "../src/utils/fetchUtils.js",
    ));
    display = jest.requireActual("../src/utils/displayCurrencyUtils.js");
    menu = jest.requireActual(
      "../src/components/ui/contextMenu/currencyContextMenu.js",
    );
  });

  afterEach(() => {
    if (document.getElementById("currencyWidget"))
      display.renderCurrencyLoading();
    for (const [type, listener] of documentAdd.mock.calls) {
      if (["currencyChange", "keydown", "mousedown"].includes(type))
        document.removeEventListener(type, listener);
    }
    if (touchDescriptor)
      Object.defineProperty(window, "ontouchstart", touchDescriptor);
    else delete window.ontouchstart;
    if (pointsDescriptor)
      Object.defineProperty(navigator, "maxTouchPoints", pointsDescriptor);
    else delete navigator.maxTouchPoints;
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    if (originalFetch === undefined) delete global.fetch;
    else global.fetch = originalFetch;
  });

  test("uses loaded rates for search and selection after the cache is deleted", async () => {
    saveCache();
    localStorage.setItem("userCurrency", "EUR");
    await initialize();
    expectRate("EUR", 0.9);
    sessionStorage.clear();
    openMenu();
    expect(menuCodes()).toEqual(["USD", "UAH", "EUR"]);
    const search = document.querySelector(".context-menu-search");
    search.value = " e ";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    expect(menuCodes()).toEqual(["EUR"]);
    search.value = "UA";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    select("UAH");
    expectRate("UAH", 41);
    expect(document.querySelector("#contextMenu")).toBeNull();
    expect(localStorage.getItem("userCurrency")).toBe("UAH");
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("keeps selection and refresh working when every storage operation throws", async () => {
    for (const method of ["getItem", "setItem", "removeItem"]) {
      jest.spyOn(window.Storage.prototype, method).mockImplementation(() => {
        throw new Error("Synthetic storage failure");
      });
    }
    await initialize();
    expectRate("UAH", 41);
    openMenu();
    select("EUR");
    expectRate("EUR", 0.9);
    expect(document.getElementById("percentageChange").textContent).toContain(
      "10%",
    );
    expectUpdated(initial);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => refreshed,
    });
    await refresh();
    expectRate("EUR", 0.8);
    expectUpdated(refreshed);
    openMenu();
    expect(menuCodes()).toEqual(["USD", "UAH", "EUR", "GBP"]);
    select("GBP");
    expectRate("GBP", 0.7);
    expect(document.querySelector("#contextMenu")).toBeNull();
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  test("keeps the in-memory choice when saving it fails and the old preference remains", async () => {
    localStorage.setItem("userCurrency", "UAH");
    await initialize();
    const setItem = window.Storage.prototype.setItem;
    jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(function (key, value) {
        if (this === localStorage)
          throw new Error("Synthetic preference write failure");
        return setItem.call(this, key, value);
      });
    openMenu();
    select("EUR");
    expectRate("EUR", 0.9);
    expect(localStorage.getItem("userCurrency")).toBe("UAH");
    await refresh();
    expectRate("EUR", 0.9);
    openMenu();
    select("USD");
    expectRate("USD", 1);
  });

  test.each(["not JSON", "{}", "[{}]"])(
    "uses API data despite corrupt cache (%s)",
    async (cache) => {
      sessionStorage.setItem("currencies", cache);
      await initialize();
      sessionStorage.setItem("currencies", cache);
      openMenu();
      expect(menuCodes()).toEqual(["USD", "UAH", "EUR"]);
      select("EUR");
      expectRate("EUR", 0.9);
      expectUpdated(initial);
    },
  );

  test("uses the fresh snapshot even if a failed history write restores the old cache pair", async () => {
    saveCache();
    localStorage.setItem("userCurrency", "EUR");
    await initialize();
    const setItem = window.Storage.prototype.setItem;
    let failed = false;
    jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(function (key, value) {
        if (this === sessionStorage && key === "currenciesDiff" && !failed) {
          failed = true;
          throw new Error("Synthetic quota failure");
        }
        return setItem.call(this, key, value);
      });
    openMenu();
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => refreshed,
    });
    await refresh();
    expect(document.querySelector("#contextMenu")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("currencies"))).toEqual(
      initial.currencies,
    );
    expect(JSON.parse(sessionStorage.getItem("currenciesDiff"))).toEqual(
      initial.currenciesDiff,
    );
    expectRate("EUR", 0.8);
    expectUpdated(refreshed);
    openMenu();
    select("UAH");
    expectRate("UAH", 42);
    expect(document.getElementById("percentageChange").textContent).toContain(
      "2.44%",
    );
  });

  test.each(["BYN", "RUB", "ZZZ", "toString", "", "UAH "])(
    "silently removes an unavailable saved selection (%s)",
    async (code) => {
      saveCache();
      localStorage.setItem("userCurrency", code);
      localStorage.setItem("otherSetting", "retained");
      const removeItem = jest.spyOn(window.Storage.prototype, "removeItem");
      await initialize();
      expectRate("UAH", 41);
      expect(localStorage.getItem("userCurrency")).toBeNull();
      expect(removeItem).toHaveBeenCalledTimes(1);
      expect(removeItem).toHaveBeenCalledWith("userCurrency");
      expect(localStorage.getItem("otherSetting")).toBe("retained");
      expect(JSON.parse(sessionStorage.getItem("currencies"))).toEqual(
        initial.currencies,
      );
    },
  );

  test("recovers in memory when removal of an invalid saved choice fails", async () => {
    localStorage.setItem("userCurrency", "BYN");
    jest
      .spyOn(window.Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("Synthetic removal failure");
      });
    await initialize();
    expectRate("UAH", 41);
    openMenu();
    select("EUR");
    expectRate("EUR", 0.9);
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
  });

  test("falls back to UAH when a selected currency disappears and ignores a stale menu choice", async () => {
    await initialize();
    openMenu();
    select("EUR");
    openMenu();
    const oldButton = document.querySelector(
      "#contextMenu li:last-child button",
    );
    const withoutEUR = {
      currencies: [
        {
          data: {
            USD: initial.currencies[0].data.USD,
            UAH: initial.currencies[0].data.UAH,
          },
        },
      ],
      currenciesDiff: [],
    };
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => withoutEUR,
    });
    await refresh();
    expectRate("UAH", 41);
    expect(localStorage.getItem("userCurrency")).toBeNull();
    expect(document.querySelector("#contextMenu")).toBeNull();
    oldButton.click();
    expectRate("UAH", 41);
    openMenu();
    expect(menuCodes()).toEqual(["USD", "UAH"]);
  });

  test.each([null, { currencies: [{}] }, "network"])(
    "preserves loaded data and choice after a failed refresh (%s)",
    async (failure) => {
      await initialize();
      openMenu();
      select("EUR");
      if (failure === "network")
        global.fetch.mockRejectedValue(new Error("Synthetic network failure"));
      else
        global.fetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => failure,
        });
      await refresh();
      expectRate("EUR", 0.9);
      openMenu();
      select("UAH");
      expectRate("UAH", 41);
      expectUpdated(initial);
      expect(document.querySelector('[role="alert"]')).toBeNull();
    },
  );

  test("shows retry without a currency menu when neither API nor cache provides usable rates", async () => {
    localStorage.setItem("userCurrency", "EUR");
    global.fetch.mockRejectedValueOnce(new Error("Synthetic network failure"));
    await initialize();
    expect(document.querySelector('[role="alert"]')).not.toBeNull();
    expect(document.getElementById("currencyPair")).toBeNull();
    menu.showContextMenu([]);
    document.dispatchEvent(
      new CustomEvent("currencyChange", { detail: { userCurrency: "USD" } }),
    );
    expect(document.querySelector("#contextMenu")).toBeNull();
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    document.querySelector("#currencyWidget button").click();
    await refresh();
    expectRate("EUR", 0.9);
    openMenu();
    select("UAH");
    expectRate("UAH", 41);
  });

  test.each(["loading", "error"])(
    "closes an open menu before rendering %s",
    async (state) => {
      await initialize();
      openMenu();
      if (state === "loading") display.renderCurrencyLoading();
      else display.renderCurrencyError(jest.fn());
      expect(document.querySelector("#contextMenu")).toBeNull();
      expect(document.getElementById("currencyPair")).toBeNull();
      document.dispatchEvent(
        new CustomEvent("currencyChange", { detail: { userCurrency: "EUR" } }),
      );
      expect(localStorage.getItem("userCurrency")).toBeNull();
    },
  );

  test("preserves outside-click, Escape, and repeated open/close behavior", async () => {
    await initialize();
    for (let count = 0; count < 3; count++) {
      openMenu();
      expect(menuCodes()).toEqual(["USD", "UAH", "EUR"]);
      document.body.dispatchEvent(
        new window.MouseEvent("mousedown", { bubbles: true }),
      );
      expect(document.querySelector("#contextMenu")).toBeNull();
    }
    openMenu();
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(document.querySelector("#contextMenu")).toBeNull();
    jest.advanceTimersByTime(300);
    expect(document.querySelectorAll(".animation-circle")).toHaveLength(0);
  });
});
