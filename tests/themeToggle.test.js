/** @jest-environment jsdom */

describe("theme toggle with optional browser storage", () => {
  let initializeThemeToggle;
  let button;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
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
    localStorage.clear();
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

  test("restores saved dark and reflects it in the button state", () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.dataset.theme = "light";
    loadModule();
    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.title).toBe("Switch to light theme");
  });

  test("uses light instead of a stale DOM theme when no preference is saved", () => {
    document.documentElement.dataset.theme = "dark";
    const write = jest.spyOn(window.Storage.prototype, "setItem");
    loadModule();
    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem("theme")).toBeNull();
    expect(write).not.toHaveBeenCalled();
  });

  test.each(["light", "", "system", "DARK", " dark "])(
    "removes saved %s, applies light and leaves other preferences intact",
    (theme) => {
      localStorage.setItem("theme", theme);
      localStorage.setItem("userCurrency", "UAH");
      loadModule();
      initializeThemeToggle(button);

      expect(document.documentElement.dataset.theme).toBe("light");
      expect(button.getAttribute("aria-pressed")).toBe("false");
      expect(button.title).toBe("Switch to dark theme");
      expect(localStorage.getItem("theme")).toBeNull();
      expect(localStorage.getItem("userCurrency")).toBe("UAH");
    },
  );

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
    expect(localStorage.getItem("theme")).toBe("dark");

    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.title).toBe("Switch to dark theme");
    expect(button.getAttribute("aria-label")).toBe("Dark theme");
    expect(document.activeElement).toBe(button);
    expect(localStorage.getItem("theme")).toBeNull();
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
    const read = jest.spyOn(window.Storage.prototype, "getItem");
    const write = jest.spyOn(window.Storage.prototype, "setItem");
    loadModule();
    initializeThemeToggle(button);
    initializeThemeToggle(button);

    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(write).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("keeps switching when localStorage access throws without using sessionStorage", () => {
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
    expect(local).not.toHaveBeenCalled();
    initializeThemeToggle(button);
    button.click();

    expect(document.documentElement.dataset.theme).toBe("dark");
    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(local).toHaveBeenCalled();
    expect(session).not.toHaveBeenCalled();
  });

  test("uses light and keeps switching when reading a saved preference fails", () => {
    localStorage.setItem("theme", "dark");
    jest.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Synthetic storage failure");
    });
    loadModule();
    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("light");
    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  test("keeps dark active after a failed write and repeated initialization", () => {
    jest.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Synthetic quota failure");
    });
    loadModule();
    initializeThemeToggle(button);

    button.click();
    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.title).toBe("Switch to light theme");
    expect(localStorage.getItem("theme")).toBeNull();
    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("keeps light active when removal of the previously saved dark fails", () => {
    localStorage.setItem("theme", "dark");
    loadModule();
    initializeThemeToggle(button);
    jest
      .spyOn(window.Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("Synthetic storage failure");
      });

    button.click();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.title).toBe("Switch to dark theme");
    expect(localStorage.getItem("theme")).toBe("dark");
    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("restores the saved choice for a new button after a page restart", () => {
    loadModule();
    initializeThemeToggle(button);
    button.click();
    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);
    button = replacement;
    document.documentElement.dataset.theme = "light";
    jest.resetModules();
    loadModule();

    initializeThemeToggle(button);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBeNull();
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
