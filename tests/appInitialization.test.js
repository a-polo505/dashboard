/** @jest-environment jsdom */

jest.mock("../src/styles/styles.css", () => ({}));
jest.mock("../src/utils/widgetInitializer.js", () => ({
  initializeWidgets: jest.fn(),
}));
jest.mock("../src/components/widgets/currencyWidget/currencyWidget.js", () => ({
  loadCurrencyWidget: jest.fn(),
}));
jest.mock("../src/components/ui/themeToggle/themeToggle.js", () => ({
  initializeThemeToggle: jest.fn(),
}));

jest.mock("../src/components/ui/gridEditor/gridEditor.js", () => ({
  initializeGridEditor: jest.fn(),
}));
jest.mock("../src/utils/widgetOverlays.js", () => ({
  closeWidgetOverlays: jest.fn(),
}));

describe("widget startup in the application entry point", () => {
  let initializeWidgets;
  let loadCurrencyWidget;
  let initializeThemeToggle;
  let initializeGridEditor;
  let closeWidgetOverlays;
  let widgets;
  let themeButton;
  let addEventListener;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML =
      '<button id="themeToggle"></button><div id="gridEditor"></div><div id="app"></div>';
    themeButton = document.getElementById("themeToggle");
    ({ initializeWidgets } = jest.requireMock(
      "../src/utils/widgetInitializer.js",
    ));
    ({ loadCurrencyWidget } = jest.requireMock(
      "../src/components/widgets/currencyWidget/currencyWidget.js",
    ));
    ({ initializeThemeToggle } = jest.requireMock(
      "../src/components/ui/themeToggle/themeToggle.js",
    ));
    widgets = [
      { id: "date", name: "Date", container: document.createElement("div") },
    ];
    initializeWidgets.mockReturnValue({ widgets });
    ({ initializeGridEditor } = jest.requireMock(
      "../src/components/ui/gridEditor/gridEditor.js",
    ));
    ({ closeWidgetOverlays } = jest.requireMock(
      "../src/utils/widgetOverlays.js",
    ));
    addEventListener = jest.spyOn(document, "addEventListener");
  });

  afterEach(() => {
    for (const [type, listener] of addEventListener.mock.calls) {
      if (type === "DOMContentLoaded")
        document.removeEventListener(type, listener);
    }
    jest.restoreAllMocks();
    document.body.replaceChildren();
  });

  test("waits for DOM readiness and initializes only once", () => {
    jest.spyOn(document, "readyState", "get").mockReturnValue("loading");
    jest.requireActual("../src/app.js");

    expect(initializeWidgets).not.toHaveBeenCalled();
    expect(loadCurrencyWidget).not.toHaveBeenCalled();
    expect(initializeGridEditor).not.toHaveBeenCalled();
    expect(initializeThemeToggle).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(initializeWidgets).toHaveBeenCalledTimes(1);
    expect(loadCurrencyWidget).toHaveBeenCalledTimes(1);
    expect(initializeGridEditor).toHaveBeenCalledTimes(1);
    expect(initializeThemeToggle).toHaveBeenCalledTimes(1);
    expect(initializeThemeToggle).toHaveBeenCalledWith(themeButton);
    expect(initializeThemeToggle.mock.invocationCallOrder[0]).toBeLessThan(
      initializeWidgets.mock.invocationCallOrder[0],
    );
    expect(initializeWidgets.mock.invocationCallOrder[0]).toBeLessThan(
      initializeGridEditor.mock.invocationCallOrder[0],
    );
    expect(initializeGridEditor.mock.invocationCallOrder[0]).toBeLessThan(
      loadCurrencyWidget.mock.invocationCallOrder[0],
    );
    const [registered, options] = initializeGridEditor.mock.calls[0];
    expect(registered).toBe(widgets);
    expect(options.grid).toBe(document.getElementById("app"));
    expect(options.toolbar).toBe(document.getElementById("gridEditor"));
    expect(closeWidgetOverlays).not.toHaveBeenCalled();
    options.beforeEdit();
    expect(closeWidgetOverlays).toHaveBeenCalledWith(widgets);
  });

  test.each(["interactive", "complete"])(
    "initializes immediately when DOM is already %s",
    (state) => {
      jest.spyOn(document, "readyState", "get").mockReturnValue(state);

      jest.requireActual("../src/app.js");
      document.dispatchEvent(new Event("DOMContentLoaded"));

      expect(initializeWidgets).toHaveBeenCalledTimes(1);
      expect(loadCurrencyWidget).toHaveBeenCalledTimes(1);
      expect(initializeGridEditor).toHaveBeenCalledTimes(1);
      expect(initializeThemeToggle).toHaveBeenCalledTimes(1);
      expect(initializeThemeToggle).toHaveBeenCalledWith(themeButton);
      expect(initializeThemeToggle.mock.invocationCallOrder[0]).toBeLessThan(
        initializeWidgets.mock.invocationCallOrder[0],
      );
      expect(initializeWidgets.mock.invocationCallOrder[0]).toBeLessThan(
        loadCurrencyWidget.mock.invocationCallOrder[0],
      );
    },
  );
});
