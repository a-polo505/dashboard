/** @jest-environment jsdom */

describe("theme toggle without browser storage", () => {
  let initializeThemeToggle;
  let button;

  beforeEach(() => {
    jest.resetModules();
    document.documentElement.removeAttribute("data-theme");
    document.body.innerHTML = `
      <button id="themeToggle" type="button" aria-label="Dark theme" aria-pressed="false">
        <svg aria-hidden="true"><path /></svg>
      </button>
      <div id="widget"><input value="41"><button id="widgetAction">Update</button></div>
    `;
    button = document.getElementById("themeToggle");
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-theme");
    jest.restoreAllMocks();
  });

  function loadModule() {
    ({ initializeThemeToggle } = jest.requireActual(
      "../src/components/ui/themeToggle/themeToggle.js",
    ));
  }

  test("import does not query or modify DOM or subscribe", () => {
    const originalHTML = document.body.innerHTML;
    const lookup = jest.spyOn(document, "getElementById");
    const query = jest.spyOn(document, "querySelector");
    const subscribe = jest.spyOn(button, "addEventListener");

    loadModule();

    expect(lookup).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(document.body.innerHTML).toBe(originalHTML);
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  test("starts with the light theme when no theme is set", () => {
    loadModule();
    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.title).toBe("Switch to dark theme");
  });

  test.each(["", "system", "invalid"])(
    "normalizes an unsupported initial theme (%s) to light",
    (theme) => {
      document.documentElement.dataset.theme = theme;
      loadModule();
      initializeThemeToggle(button);

      expect(document.documentElement.dataset.theme).toBe("light");
      expect(button.getAttribute("aria-pressed")).toBe("false");
    },
  );

  test("reflects an existing dark theme in the button state", () => {
    document.documentElement.dataset.theme = "dark";
    loadModule();
    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.title).toBe("Switch to light theme");
  });

  test("toggles both ways and keeps its accessible label and focus", () => {
    loadModule();
    initializeThemeToggle(button);
    button.focus();

    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.title).toBe("Switch to light theme");
    expect(button.getAttribute("aria-label")).toBe("Dark theme");
    expect(document.activeElement).toBe(button);

    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.title).toBe("Switch to dark theme");
    expect(button.getAttribute("aria-label")).toBe("Dark theme");
    expect(document.activeElement).toBe(button);
  });

  test("handles a click that bubbles from a nested icon", () => {
    loadModule();
    initializeThemeToggle(button);

    button
      .querySelector("path")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  test("repeated initialization does not toggle twice per click", () => {
    loadModule();
    initializeThemeToggle(button);
    initializeThemeToggle(button);

    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("does not access storage even when its getters throw", () => {
    const local = jest
      .spyOn(window, "localStorage", "get")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
    const session = jest
      .spyOn(window, "sessionStorage", "get")
      .mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
    loadModule();
    initializeThemeToggle(button);
    button.click();

    expect(document.documentElement.dataset.theme).toBe("dark");
    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(local).not.toHaveBeenCalled();
    expect(session).not.toHaveBeenCalled();
  });

  test("preserves widget nodes, current input and existing listeners", () => {
    const widget = document.getElementById("widget");
    const input = widget.querySelector("input");
    input.value = "44.9776";
    const onAction = jest.fn();
    const action = document.getElementById("widgetAction");
    action.addEventListener("click", onAction);
    loadModule();
    initializeThemeToggle(button);

    button.click();
    button.click();

    expect(document.getElementById("widget")).toBe(widget);
    expect(widget.querySelector("input")).toBe(input);
    expect(input.value).toBe("44.9776");
    expect(document.getElementById("widgetAction")).toBe(action);
    action.click();
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test.each([null, undefined])("ignores a missing button (%s)", (missing) => {
    loadModule();

    expect(() => initializeThemeToggle(missing)).not.toThrow();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
