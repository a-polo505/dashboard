/** @jest-environment jsdom */

jest.mock("../src/utils/displayCurrencyUtils.js", () => ({
  renderCurrencyContainer: jest.fn(),
  renderCurrencyLoading: jest.fn(),
  renderCurrencyError: jest.fn(),
}));

const cachedData = {
  currencies: [
    {
      _id: "synthetic-current",
      data: {
        USD: { code: "USD", value: 1 },
        UAH: { code: "UAH", value: 40 },
        EUR: { code: "EUR", value: 0.9 },
      },
    },
  ],
  currenciesDiff: [{ data: { UAH: { code: "UAH", value: 39 } } }],
};
const freshData = {
  currencies: [
    {
      data: {
        ...cachedData.currencies[0].data,
        UAH: { code: "UAH", value: 41 },
      },
    },
  ],
  currenciesDiff: [{ data: cachedData.currencies[0].data }],
};

describe("currency widget loading and recovery", () => {
  const originalFetch = global.fetch;
  let fetchAndUpdateData;
  let fetchDataAndDisplay;
  let renderCurrencyContainer;
  let renderCurrencyLoading;
  let renderCurrencyError;
  let response;

  function saveCache(data = cachedData) {
    sessionStorage.setItem("currencies", JSON.stringify(data.currencies));
    sessionStorage.setItem(
      "currenciesDiff",
      JSON.stringify(data.currenciesDiff),
    );
  }

  function expectCache(data = cachedData) {
    expect(sessionStorage.getItem("currencies")).toBe(
      JSON.stringify(data.currencies),
    );
    expect(sessionStorage.getItem("currenciesDiff")).toBe(
      JSON.stringify(data.currenciesDiff),
    );
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
    response = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(freshData),
    };
    global.fetch = jest.fn().mockResolvedValue(response);
    ({ renderCurrencyContainer, renderCurrencyLoading, renderCurrencyError } =
      jest.requireMock("../src/utils/displayCurrencyUtils.js"));
    ({ fetchAndUpdateData, fetchDataAndDisplay } = jest.requireActual(
      "../src/utils/fetchUtils.js",
    ));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }
  });

  test("displays valid cached rates immediately without fetching or changing the cache", async () => {
    saveCache();
    localStorage.setItem("userCurrency", "EUR");

    await fetchDataAndDisplay();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(renderCurrencyContainer).toHaveBeenCalledWith(
      expect.stringContaining("USD / EUR"),
    );
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expectCache();
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(jest.getTimerCount()).toBe(1);
  });

  test.each([null, "not JSON", "[]", "{}", "[{}]", "true"])(
    "fetches fresh data after unusable cached current rates (%s)",
    async (cache) => {
      if (cache !== null) sessionStorage.setItem("currencies", cache);

      await fetchDataAndDisplay();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("/api/currencies", {
        headers: { "Cache-Control": "no-cache" },
      });
      expect(renderCurrencyLoading).toHaveBeenCalledTimes(1);
      expect(renderCurrencyContainer).toHaveBeenCalledWith(
        expect.stringContaining(">41<"),
      );
      expect(renderCurrencyError).not.toHaveBeenCalled();
      expectCache(freshData);
      expect(jest.getTimerCount()).toBe(1);
    },
  );

  test("rejects HTTP errors before parsing their bodies and preserves the last good cache and view", async () => {
    saveCache();
    await fetchDataAndDisplay();
    renderCurrencyContainer.mockClear();
    response.ok = false;
    response.status = 500;

    await fetchAndUpdateData();

    expect(response.json).not.toHaveBeenCalled();
    expect(renderCurrencyContainer).not.toHaveBeenCalled();
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expectCache();
  });

  test.each([
    null,
    {},
    { currencies: [] },
    { currencies: {} },
    { currencies: [{}] },
    { currencies: [...cachedData.currencies, ...cachedData.currencies] },
    {
      currencies: [
        {
          data: {
            USD: { code: "USD", value: 1 },
            UAH: { code: "UAH", value: 0 },
          },
        },
      ],
    },
  ])("does not cache an invalid HTTP 200 payload (%#)", async (payload) => {
    saveCache();
    await fetchDataAndDisplay();
    renderCurrencyContainer.mockClear();
    const cacheWrite = jest.spyOn(window.Storage.prototype, "setItem");
    response.json.mockResolvedValue(payload);

    await fetchAndUpdateData();

    expectCache();
    expect(cacheWrite).not.toHaveBeenCalled();
    expect(renderCurrencyContainer).not.toHaveBeenCalled();
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
    expect(renderCurrencyError).not.toHaveBeenCalled();
  });

  test.each(["network", "JSON"])(
    "retains cached rates on a %s failure",
    async (stage) => {
      saveCache();
      await fetchDataAndDisplay();
      renderCurrencyContainer.mockClear();
      if (stage === "network")
        global.fetch.mockRejectedValue(new Error("Synthetic network failure"));
      else
        response.json.mockRejectedValue(
          new SyntaxError("Synthetic JSON failure"),
        );

      await fetchAndUpdateData();

      expectCache();
      expect(renderCurrencyContainer).not.toHaveBeenCalled();
      expect(renderCurrencyError).not.toHaveBeenCalled();
      expect(renderCurrencyLoading).not.toHaveBeenCalled();
    },
  );

  test("shows an error with retry when no usable rates exist, then recovers", async () => {
    sessionStorage.setItem("currencies", "[]");
    localStorage.setItem("userCurrency", "EUR");
    global.fetch.mockRejectedValueOnce(new Error("Synthetic failure"));

    await fetchDataAndDisplay();

    expect(renderCurrencyContainer).not.toHaveBeenCalled();
    expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(sessionStorage.getItem("currencies")).toBe("[]");
    expect(jest.getTimerCount()).toBe(1);

    const retry = renderCurrencyError.mock.calls[0][0];
    await retry();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(renderCurrencyLoading).toHaveBeenCalledTimes(2);
    expect(renderCurrencyContainer).toHaveBeenCalledWith(
      expect.stringContaining("USD / EUR"),
    );
    expectCache(freshData);
    expect(jest.getTimerCount()).toBe(1);
  });

  test("shows retry for an invalid response without discarding the saved currency choice", async () => {
    localStorage.setItem("userCurrency", "BYN");
    response.json.mockResolvedValue({ currencies: [{}] });

    await fetchDataAndDisplay();

    expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
    expect(localStorage.getItem("userCurrency")).toBe("BYN");
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
  });

  test("allows manual retry after an HTTP error without a cache", async () => {
    response.ok = false;
    response.status = 503;
    await fetchDataAndDisplay();

    expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
    expect(response.json).not.toHaveBeenCalled();

    response.ok = true;
    response.status = 200;
    await renderCurrencyError.mock.calls[0][0]();

    expectCache(freshData);
    expect(renderCurrencyContainer).toHaveBeenCalledTimes(1);
  });

  test.each([undefined, null, {}, []])(
    "renders fresh current rates without usable historical data (%#)",
    async (history) => {
      response.json.mockResolvedValue({
        ...freshData,
        currenciesDiff: history,
      });

      await fetchDataAndDisplay();

      expect(renderCurrencyContainer).toHaveBeenCalledWith(
        expect.stringContaining("currency--percentage neutral"),
      );
      expectCache({ ...freshData, currenciesDiff: [] });
    },
  );

  test("renders cached current rates with a corrupt historical cache without a network request", async () => {
    saveCache();
    sessionStorage.setItem("currenciesDiff", "bad JSON");

    await fetchDataAndDisplay();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(renderCurrencyContainer).toHaveBeenCalledWith(
      expect.stringContaining("0.00%"),
    );
  });

  test("keeps periodic refresh available after an initial failure", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Synthetic failure"));
    await fetchDataAndDisplay();

    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(renderCurrencyContainer).toHaveBeenCalledTimes(1);
    expectCache(freshData);
    expect(jest.getTimerCount()).toBe(1);
  });

  test("does not create multiple refresh timers on repeated initialization", async () => {
    saveCache();
    await fetchDataAndDisplay();
    await fetchDataAndDisplay();
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
  });

  test("shares a pending request across initialization, manual retry and periodic refresh", async () => {
    let finishFetch;
    global.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFetch = resolve;
        }),
    );
    const initialization = fetchDataAndDisplay();
    const first = fetchAndUpdateData();
    const second = fetchAndUpdateData();
    await jest.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(first).toBe(second);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    finishFetch(response);
    await initialization;
    await first;

    expectCache(freshData);
    await fetchAndUpdateData();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("does not replace the visible rates with a loader during a background refresh", async () => {
    saveCache();
    await fetchDataAndDisplay();
    renderCurrencyContainer.mockClear();
    let finishFetch;
    global.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFetch = resolve;
        }),
    );

    const request = fetchAndUpdateData();
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
    expect(renderCurrencyContainer).not.toHaveBeenCalled();
    expectCache();

    finishFetch(response);
    await request;
    expectCache(freshData);
    expect(renderCurrencyContainer).toHaveBeenCalledWith(
      expect.stringContaining(">41<"),
    );
  });

  test("restores the old cache pair if the second storage write fails and keeps fresh rates visible", async () => {
    saveCache();
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

    await fetchAndUpdateData();

    expectCache();
    expect(renderCurrencyContainer).toHaveBeenLastCalledWith(
      expect.stringContaining(">41<"),
    );
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Error caching currency data");

    global.fetch.mockRejectedValue(new Error("Synthetic network failure"));
    await fetchAndUpdateData();
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
  });

  test("removes a partial new cache when the historical write fails on the first load", async () => {
    const setItem = window.Storage.prototype.setItem;
    jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(function (key, value) {
        if (this === sessionStorage && key === "currenciesDiff") {
          throw new Error("Synthetic quota failure");
        }
        return setItem.call(this, key, value);
      });

    await fetchDataAndDisplay();

    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
    expect(renderCurrencyContainer).toHaveBeenCalledWith(
      expect.stringContaining(">41<"),
    );
    expect(renderCurrencyError).not.toHaveBeenCalled();
  });

  test("keeps fresh rates visible even when storage writes and restoration are unavailable", async () => {
    saveCache();
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    await fetchAndUpdateData();

    expectCache();
    expect(renderCurrencyContainer).toHaveBeenLastCalledWith(
      expect.stringContaining(">41<"),
    );
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Error caching currency data");
  });
});
