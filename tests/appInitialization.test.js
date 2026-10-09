/** @jest-environment jsdom */

jest.mock("../src/styles/styles.css", () => ({}));
jest.mock("../src/utils/widgetInitializer.js", () => ({
  initializeWidgets: jest.fn(),
}));
jest.mock("../src/components/ui/tooltip/infoTooltip.js", () => ({}));
jest.mock("../src/components/widgets/currencyWidget/currencyWidget.js", () => ({
  initializeCurrencyWidget: jest.fn(),
}));

describe("widget startup in the application entry point", () => {
  let initializeWidgets;
  let initializeCurrencyWidget;
  let addEventListener;

  beforeEach(() => {
    jest.resetModules();
    ({ initializeWidgets } = jest.requireMock(
      "../src/utils/widgetInitializer.js",
    ));
    ({ initializeCurrencyWidget } = jest.requireMock(
      "../src/components/widgets/currencyWidget/currencyWidget.js",
    ));
    addEventListener = jest.spyOn(document, "addEventListener");
  });

  afterEach(() => {
    for (const [type, listener] of addEventListener.mock.calls) {
      if (type === "DOMContentLoaded")
        document.removeEventListener(type, listener);
    }
    jest.restoreAllMocks();
  });

  test("waits for DOM readiness and initializes only once", () => {
    jest.spyOn(document, "readyState", "get").mockReturnValue("loading");
    jest.requireActual("../src/app.js");

    expect(initializeWidgets).not.toHaveBeenCalled();
    expect(initializeCurrencyWidget).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(initializeWidgets).toHaveBeenCalledTimes(1);
    expect(initializeCurrencyWidget).toHaveBeenCalledTimes(1);
    expect(initializeWidgets.mock.invocationCallOrder[0]).toBeLessThan(
      initializeCurrencyWidget.mock.invocationCallOrder[0],
    );
  });

  test.each(["interactive", "complete"])(
    "initializes immediately when DOM is already %s",
    (state) => {
      jest.spyOn(document, "readyState", "get").mockReturnValue(state);

      jest.requireActual("../src/app.js");
      document.dispatchEvent(new Event("DOMContentLoaded"));

      expect(initializeWidgets).toHaveBeenCalledTimes(1);
      expect(initializeCurrencyWidget).toHaveBeenCalledTimes(1);
      expect(initializeWidgets.mock.invocationCallOrder[0]).toBeLessThan(
        initializeCurrencyWidget.mock.invocationCallOrder[0],
      );
    },
  );
});
