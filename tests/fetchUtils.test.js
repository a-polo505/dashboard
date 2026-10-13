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
    sessionStorage.setItem("currencySnapshot", JSON.stringify(data));
  }

  function expectCache(data = cachedData) {
    expect(sessionStorage.getItem("currencySnapshot")).toBe(
      JSON.stringify(data),
    );
  }

  function waitForAbort(signal) {
    return new Promise((resolve, reject) => {
      signal.addEventListener(
        "abort",
        () =>
          reject(new window.DOMException("Synthetic timeout", "AbortError")),
        { once: true },
      );
    });
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
    expect(renderCurrencyContainer).toHaveBeenCalledWith(cachedData);
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expectCache();
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(jest.getTimerCount()).toBe(1);
  });

  test.each([false, true])(
    "displays legacy rates without a request even when migration fails (%s)",
    async (migrationFails) => {
      sessionStorage.setItem(
        "currencies",
        JSON.stringify(cachedData.currencies),
      );
      sessionStorage.setItem(
        "currenciesDiff",
        JSON.stringify(cachedData.currenciesDiff),
      );
      if (migrationFails) {
        jest
          .spyOn(window.Storage.prototype, "setItem")
          .mockImplementation(() => {
            throw new Error("Synthetic migration failure");
          });
      }

      await fetchDataAndDisplay();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(renderCurrencyContainer).toHaveBeenCalledWith(cachedData);
      expect(renderCurrencyLoading).not.toHaveBeenCalled();
      expect(renderCurrencyError).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(1);
      expect(sessionStorage.getItem("currencySnapshot")).toBe(
        migrationFails ? null : JSON.stringify(cachedData),
      );
      for (const key of ["currencies", "currenciesDiff"]) {
        expect(sessionStorage.getItem(key)).toBe(
          migrationFails ? JSON.stringify(cachedData[key]) : null,
        );
      }
    },
  );

  test.each([null, "not JSON", "[]", "{}", "[{}]", "true"])(
    "fetches fresh data after unusable cached current rates (%s)",
    async (cache) => {
      if (cache !== null) sessionStorage.setItem("currencySnapshot", cache);

      await fetchDataAndDisplay();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("/api/currencies", {
        headers: { "Cache-Control": "no-cache" },
        signal: expect.any(window.AbortSignal),
      });
      expect(renderCurrencyLoading).toHaveBeenCalledTimes(1);
      expect(renderCurrencyContainer).toHaveBeenCalledWith(freshData);
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
    sessionStorage.setItem("currencySnapshot", "[]");
    localStorage.setItem("userCurrency", "EUR");
    global.fetch.mockRejectedValueOnce(new Error("Synthetic failure"));

    await fetchDataAndDisplay();

    expect(renderCurrencyContainer).not.toHaveBeenCalled();
    expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(sessionStorage.getItem("currencySnapshot")).toBe("[]");
    expect(jest.getTimerCount()).toBe(1);

    const retry = renderCurrencyError.mock.calls[0][0];
    await retry();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(renderCurrencyLoading).toHaveBeenCalledTimes(2);
    expect(renderCurrencyContainer).toHaveBeenCalledWith(freshData);
    expectCache(freshData);
    expect(jest.getTimerCount()).toBe(1);
  });

  test("shows retry for an invalid response without discarding the saved currency choice", async () => {
    localStorage.setItem("userCurrency", "BYN");
    response.json.mockResolvedValue({ currencies: [{}] });

    await fetchDataAndDisplay();

    expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
    expect(localStorage.getItem("userCurrency")).toBe("BYN");
    expect(sessionStorage.getItem("currencySnapshot")).toBeNull();
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

      expect(renderCurrencyContainer).toHaveBeenCalledWith({
        ...freshData,
        currenciesDiff: [],
      });
      expectCache({ ...freshData, currenciesDiff: [] });
    },
  );

  test("renders cached current rates with a corrupt historical cache without a network request", async () => {
    sessionStorage.setItem("currencies", JSON.stringify(cachedData.currencies));
    sessionStorage.setItem("currenciesDiff", "bad JSON");

    await fetchDataAndDisplay();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(renderCurrencyContainer).toHaveBeenCalledWith({
      ...cachedData,
      currenciesDiff: [],
    });
    expectCache({ ...cachedData, currenciesDiff: [] });
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
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
    const intervals = jest.spyOn(global, "setInterval");
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
    const periodic = intervals.mock.calls[0][0]();
    await jest.advanceTimersByTimeAsync(5_000);

    expect(first).toBe(second);
    expect(first).toBe(periodic);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    finishFetch(response);
    await initialization;
    await first;

    expectCache(freshData);
    await fetchAndUpdateData();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test.each([
    ["fetch", false],
    ["body", false],
    ["fetch", true],
    ["body", true],
  ])(
    "recovers after a %s timeout with displayed rates=%s",
    async (stage, hasCachedRates) => {
      localStorage.setItem("userCurrency", "EUR");
      if (hasCachedRates) {
        saveCache();
        await fetchDataAndDisplay();
        renderCurrencyContainer.mockClear();
      }
      let signal;
      global.fetch.mockImplementationOnce((url, options) => {
        signal = options.signal;
        if (stage === "fetch") return waitForAbort(signal);
        response.json.mockImplementationOnce(() => waitForAbort(signal));
        return Promise.resolve(response);
      });

      const request = fetchAndUpdateData();
      expect(fetchAndUpdateData()).toBe(request);
      await jest.advanceTimersByTimeAsync(14_999);
      expect(signal.aborted).toBe(false);
      expect(renderCurrencyError).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      await request;

      expect(signal.aborted).toBe(true);
      expect(renderCurrencyContainer).not.toHaveBeenCalled();
      expect(localStorage.getItem("userCurrency")).toBe("EUR");
      expect(jest.getTimerCount()).toBe(hasCachedRates ? 1 : 0);
      expect(sessionStorage.getItem("currencySnapshot")).toBe(
        hasCachedRates ? JSON.stringify(cachedData) : null,
      );
      expect(renderCurrencyError.mock.calls).toEqual(
        hasCachedRates ? [] : [[fetchAndUpdateData]],
      );
      expect(renderCurrencyLoading).toHaveBeenCalledTimes(
        hasCachedRates ? 0 : 1,
      );
      const retry = hasCachedRates
        ? fetchAndUpdateData
        : renderCurrencyError.mock.calls[0][0];
      await retry();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      const retrySignal = global.fetch.mock.calls[1][1].signal;
      expect(retrySignal).not.toBe(signal);
      expect(retrySignal.aborted).toBe(false);
      expect(renderCurrencyContainer).toHaveBeenCalledWith(freshData);
      expectCache(freshData);
      expect(jest.getTimerCount()).toBe(hasCachedRates ? 1 : 0);
    },
  );

  test("uses one deadline for receiving headers and consuming the response body", async () => {
    let finishFetch;
    let signal;
    global.fetch.mockImplementationOnce((url, options) => {
      signal = options.signal;
      response.json.mockImplementationOnce(() => waitForAbort(signal));
      return new Promise((resolve) => {
        finishFetch = resolve;
      });
    });
    const request = fetchAndUpdateData();
    await jest.advanceTimersByTimeAsync(10_000);
    finishFetch(response);
    await jest.advanceTimersByTimeAsync(4_999);

    expect(response.json).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await request;

    expect(signal.aborted).toBe(true);
    expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });

  test("clears the deadline after a response just before the timeout", async () => {
    let finishFetch;
    global.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFetch = resolve;
        }),
    );
    const request = fetchAndUpdateData();
    const signal = global.fetch.mock.calls[0][1].signal;
    await jest.advanceTimersByTimeAsync(14_999);
    finishFetch(response);
    await request;
    await jest.advanceTimersByTimeAsync(15_000);

    expect(signal.aborted).toBe(false);
    expect(renderCurrencyContainer).toHaveBeenCalledWith(freshData);
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  test.each(["network", "HTTP", "JSON", "payload"])(
    "clears the deadline after an early %s failure",
    async (stage) => {
      if (stage === "network")
        global.fetch.mockRejectedValueOnce(new Error("Synthetic failure"));
      if (stage === "HTTP") response.ok = false;
      if (stage === "JSON")
        response.json.mockRejectedValueOnce(
          new SyntaxError("Synthetic JSON failure"),
        );
      if (stage === "payload")
        response.json.mockResolvedValueOnce({ currencies: [] });

      await fetchAndUpdateData();
      const signal = global.fetch.mock.calls[0][1].signal;
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(15_000);

      expect(signal.aborted).toBe(false);
      expect(renderCurrencyError).toHaveBeenCalledWith(expect.any(Function));
      expect(renderCurrencyContainer).not.toHaveBeenCalled();
      expect(sessionStorage.getItem("currencySnapshot")).toBeNull();
    },
  );

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
    expect(renderCurrencyContainer).toHaveBeenCalledWith(freshData);
  });

  test("preserves the previous snapshot when its replacement fails and keeps fresh rates visible", async () => {
    saveCache();
    const setItem = window.Storage.prototype.setItem;
    let failed = false;
    jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(function (key, value) {
        if (this === sessionStorage && key === "currencySnapshot" && !failed) {
          failed = true;
          throw new Error("Synthetic quota failure");
        }
        return setItem.call(this, key, value);
      });

    await fetchAndUpdateData();

    expectCache();
    expect(renderCurrencyContainer).toHaveBeenLastCalledWith(freshData);
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Error caching currency data");

    global.fetch.mockRejectedValue(new Error("Synthetic network failure"));
    await fetchAndUpdateData();
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(renderCurrencyLoading).not.toHaveBeenCalled();
  });

  test("leaves no snapshot when its first write fails but displays fresh rates", async () => {
    const setItem = window.Storage.prototype.setItem;
    jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(function (key, value) {
        if (this === sessionStorage && key === "currencySnapshot") {
          throw new Error("Synthetic quota failure");
        }
        return setItem.call(this, key, value);
      });

    await fetchDataAndDisplay();

    expect(sessionStorage.getItem("currencySnapshot")).toBeNull();
    expect(sessionStorage.getItem("currencies")).toBeNull();
    expect(sessionStorage.getItem("currenciesDiff")).toBeNull();
    expect(renderCurrencyContainer).toHaveBeenCalledWith(freshData);
    expect(renderCurrencyError).not.toHaveBeenCalled();
  });

  test("keeps fresh rates visible when storage writes are unavailable", async () => {
    saveCache();
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });

    await fetchAndUpdateData();

    expectCache();
    expect(renderCurrencyContainer).toHaveBeenLastCalledWith(freshData);
    expect(renderCurrencyError).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Error caching currency data");
  });
});
