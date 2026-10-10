/** @jest-environment jsdom */

jest.mock("../src/components/ui/contextMenu/currencyContextMenu.js", () => ({
  showContextMenu: jest.fn(),
}));

const payload = {
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
      data: {
        UAH: { code: "UAH", value: 40 },
        EUR: { code: "EUR", value: 1 },
      },
    },
  ],
};

describe("explicit currency widget initialization", () => {
  const originalFetch = global.fetch;
  let initializeCurrencyWidget;
  let addEventListener;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    document.body.innerHTML =
      '<div class="widgets"><div id="otherWidget"></div></div>';
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(payload),
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    addEventListener = jest.spyOn(document, "addEventListener");
    ({ initializeCurrencyWidget } = jest.requireActual(
      "../src/components/widgets/currencyWidget/currencyWidget.js",
    ));
  });

  afterEach(() => {
    if (document.getElementById("currencyWidget")) {
      jest
        .requireActual("../src/utils/displayCurrencyUtils.js")
        .renderCurrencyLoading();
    }
    for (const [type, listener] of addEventListener.mock.calls) {
      if (type === "currencyChange")
        document.removeEventListener(type, listener);
    }
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    if (originalFetch === undefined) delete global.fetch;
    else global.fetch = originalFetch;
  });

  function saveCache() {
    sessionStorage.setItem("currencies", JSON.stringify(payload.currencies));
    sessionStorage.setItem(
      "currenciesDiff",
      JSON.stringify(payload.currenciesDiff),
    );
  }

  test("importing the widget does not mount DOM, fetch data or subscribe to currency changes", () => {
    expect(document.getElementById("currencyWidget")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      addEventListener.mock.calls.filter(([type]) => type === "currencyChange"),
    ).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("mounts the existing design and displays cached rates with the original DOM order", async () => {
    saveCache();

    await initializeCurrencyWidget();

    const container = document.getElementById("currencyWidget");
    expect(container.classList.contains("Container--small")).toBe(true);
    expect(container.classList.contains("currency-widget-container")).toBe(
      true,
    );
    expect(document.querySelector(".widgets").firstElementChild).toBe(
      container,
    );
    expect(document.getElementById("otherWidget")).not.toBeNull();
    expect(document.getElementById("currencyPair").textContent).toBe(
      "USD / UAH",
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(1);
  });

  test("does not duplicate the container, event subscription or timer on repeated initialization", async () => {
    saveCache();
    await initializeCurrencyWidget();
    const container = document.getElementById("currencyWidget");
    await initializeCurrencyWidget();

    expect(document.querySelectorAll("#currencyWidget")).toHaveLength(1);
    expect(document.getElementById("currencyWidget")).toBe(container);
    expect(
      addEventListener.mock.calls.filter(([type]) => type === "currencyChange"),
    ).toHaveLength(1);
    expect(jest.getTimerCount()).toBe(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("renders a saved currency change after explicit initialization", async () => {
    saveCache();
    await initializeCurrencyWidget();
    localStorage.setItem("userCurrency", "EUR");

    document.dispatchEvent(
      new CustomEvent("currencyChange", { detail: { userCurrency: "EUR" } }),
    );

    expect(document.getElementById("currencyPair").textContent).toBe(
      "USD / EUR",
    );
    expect(document.getElementById("rate").textContent).toBe("0.9");
    expect(
      document
        .getElementById("percentageChange")
        .classList.contains("negative"),
    ).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("fetches and renders fresh data on first initialization without a cache", async () => {
    await initializeCurrencyWidget();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(document.getElementById("currencyPair").textContent).toBe(
      "USD / UAH",
    );
    expect(document.getElementById("loadingSpinner")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("currencies"))).toEqual(
      payload.currencies,
    );
    expect(jest.getTimerCount()).toBe(1);
  });

  test("preserves error recovery through the real retry button", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Synthetic failure"));
    await initializeCurrencyWidget();
    const container = document.getElementById("currencyWidget");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();

    const retryButton = container.querySelector("button");
    retryButton.click();
    // Join the request already started by the click; no additional fetch is created.
    await jest.requireActual("../src/utils/fetchUtils.js").fetchAndUpdateData();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(document.getElementById("currencyWidget")).toBe(container);
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.getElementById("currencyPair").textContent).toBe(
      "USD / UAH",
    );
    expect(jest.getTimerCount()).toBe(1);
  });

  test("can initialize after the parent element becomes available", async () => {
    document.body.innerHTML = "";
    expect(() => initializeCurrencyWidget()).toThrow(
      "Currency widget parent element not found",
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);

    document.body.innerHTML = '<div class="widgets"></div>';
    await initializeCurrencyWidget();

    expect(document.querySelectorAll("#currencyWidget")).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
