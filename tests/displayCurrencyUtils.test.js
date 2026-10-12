/** @jest-environment jsdom */

jest.mock("../src/components/ui/contextMenu/currencyContextMenu.js", () => ({
  showContextMenu: jest.fn(),
  closeContextMenu: jest.fn(),
}));

describe("currency loading and error states", () => {
  let renderCurrencyContainer;
  let renderCurrencyLoading;
  let renderCurrencyError;

  beforeAll(() => {
    document.body.innerHTML = '<div class="widgets"></div>';
    const display = jest.requireActual("../src/utils/displayCurrencyUtils.js");
    ({ renderCurrencyContainer, renderCurrencyLoading, renderCurrencyError } =
      display);
    display.mountCurrencyWidget();
  });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    renderCurrencyLoading();
  });

  test("replaces the initial spinner with an accessible error and a working retry button", () => {
    renderCurrencyLoading();
    const retry = jest.fn();

    renderCurrencyError(retry);

    expect(document.getElementById("loadingSpinner")).toBeNull();
    expect(document.querySelector('[role="alert"]').textContent).toContain(
      "Currency rates are unavailable",
    );
    const button = document.querySelector("#currencyWidget button");
    expect(button.type).toBe("button");
    expect(button.textContent).toBe("Try again");
    button.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test("replaces the error with one visible spinner when retry starts", () => {
    renderCurrencyError(jest.fn());

    renderCurrencyLoading();
    renderCurrencyLoading();

    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.querySelector("#currencyWidget button")).toBeNull();
    expect(document.querySelectorAll("#loadingSpinner")).toHaveLength(1);
    expect(document.getElementById("loadingSpinner").style.display).toBe(
      "flex",
    );
    expect(
      document.querySelector('[role="status"]').getAttribute("aria-label"),
    ).toBe("Loading currency rates");
  });

  test("shows only its own spinner despite an earlier element with the same ID", () => {
    const outsideSpinner = document.createElement("div");
    outsideSpinner.id = "loadingSpinner";
    outsideSpinner.style.display = "none";
    document.body.prepend(outsideSpinner);
    const container = document.getElementById("currencyWidget");

    try {
      for (let cycle = 0; cycle < 2; cycle++) {
        renderCurrencyError(jest.fn());
        renderCurrencyLoading();
        const spinner = container.querySelector("#loadingSpinner");
        expect(document.getElementById("loadingSpinner")).toBe(outsideSpinner);
        expect(spinner.style.display).toBe("flex");
        expect(outsideSpinner.style.display).toBe("none");

        renderCurrencyLoading();
        expect(spinner.isConnected).toBe(false);
        expect(container.querySelectorAll("#loadingSpinner")).toHaveLength(1);
        expect(container.querySelector("#loadingSpinner").style.display).toBe(
          "flex",
        );
        expect(outsideSpinner.style.display).toBe("none");
      }
    } finally {
      outsideSpinner.remove();
    }
  });

  test("restores the normal currency view after error recovery", () => {
    renderCurrencyError(jest.fn());
    const currencies = [
      {
        data: {
          USD: { code: "USD", value: 1 },
          UAH: { code: "UAH", value: 41 },
        },
      },
    ];
    sessionStorage.setItem("currencies", JSON.stringify(currencies));

    renderCurrencyContainer({ currencies, currenciesDiff: [] });

    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.getElementById("loadingSpinner")).toBeNull();
    expect(document.getElementById("currencyPair").textContent).toBe(
      "USD / UAH",
    );
    expect(document.getElementById("rate").textContent).toBe("41");
    expect(document.querySelectorAll("#currencyWidget")).toHaveLength(1);
  });
});
