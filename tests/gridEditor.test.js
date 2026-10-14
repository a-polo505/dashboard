/** @jest-environment jsdom */

import { initializeGridEditor } from "../src/components/ui/gridEditor/gridEditor.js";

describe("desktop grid editor", () => {
  const originalMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  let grid;
  let toolbar;
  let widgets;
  let desktop;
  let touch;
  let beforeEdit;
  let editor;

  function media(matches) {
    const callbacks = new Set();
    return {
      matches,
      addEventListener: jest.fn((type, callback) => callbacks.add(callback)),
      removeEventListener: jest.fn((type, callback) =>
        callbacks.delete(callback),
      ),
      change(value) {
        this.matches = value;
        for (const callback of callbacks) callback(new Event("change"));
      },
    };
  }

  const button = (id) => document.getElementById(id);
  const entries = () => widgets.map(({ id }) => ({ id, is_remove: false }));
  const storedCustom = () => ({
    version: 1,
    widgets: [
      { id: "coffee", is_remove: false },
      { id: "date", is_remove: false },
      { id: "countdown", is_remove: false },
      { id: "currency", is_remove: true },
    ],
  });
  const visibleIds = () =>
    Array.from(grid.children)
      .filter((node) => !node.hidden)
      .map((node) => node.dataset.widgetId);
  const remove = (id) => grid.querySelector(`[data-remove-widget="${id}"]`);
  const begin = () => button("customizeButton").click();
  const save = () => button("saveLayoutButton").click();
  const cancel = () => button("cancelCustomizationButton").click();
  const reset = () => button("resetLayoutButton").click();

  function initialize() {
    editor = initializeGridEditor(widgets, { grid, toolbar, beforeEdit });
    return editor;
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML =
      '<header><div id="gridEditor" hidden></div></header><div id="app" class="widgets"></div>';
    grid = button("app");
    toolbar = button("gridEditor");
    widgets = ["date", "currency", "coffee", "countdown"].map((id) => {
      const container = document.createElement("div");
      container.className = "Container";
      container.dataset.widgetId = id;
      container.innerHTML = `<button>${id} action</button><span>Tooltip target</span>`;
      grid.appendChild(container);
      return { id, name: id.toUpperCase(), container };
    });
    desktop = media(true);
    touch = media(false);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn((query) =>
        query === "(prefers-reduced-motion: reduce)"
          ? media(false)
          : query === "(any-pointer: coarse)"
            ? touch
            : desktop,
      ),
    });
    beforeEdit = jest.fn();
    editor = null;
  });

  afterEach(() => {
    editor?.destroy();
    jest.restoreAllMocks();
    localStorage.clear();
    document.body.replaceChildren();
    if (originalMedia)
      Object.defineProperty(window, "matchMedia", originalMedia);
    else delete window.matchMedia;
  });

  test("shows the desktop edit button and keeps the existing containers unwrapped", () => {
    initialize();

    expect(toolbar.hidden).toBe(false);
    expect(button("customizeButton").hidden).toBe(false);
    expect(button("saveLayoutButton").hidden).toBe(true);
    expect([...grid.children]).toEqual(
      widgets.map(({ container }) => container),
    );
    expect(localStorage.getItem("dashboardLayout")).toBeNull();
    expect(beforeEdit).not.toHaveBeenCalled();
  });

  test.each([
    ["customizeButton", "Customize", "M7.70059"],
    ["saveLayoutButton", "Save", "m15.56"],
    ["addWidgetButton", "Add Widget", "M8.75"],
    ["resetLayoutButton", "Reset Layout", "M13.5"],
    ["cancelCustomizationButton", "Cancel", "m12.47"],
  ])(
    "renders %s with its English label and clean decorative icon",
    (id, label, pathStart) => {
      initialize();
      const element = button(id);
      const svg = element.querySelector("svg");

      expect(element.textContent).toBe(label);
      expect(element.type).toBe("button");
      expect(element.classList.contains("primary-btn")).toBe(true);
      expect(element.classList.contains("icon-button")).toBe(true);
      expect(element.classList.contains("grid-editor__button")).toBe(true);
      expect(svg.getAttribute("viewBox")).toBe("0 0 16 16");
      expect(svg.getAttribute("width")).toBe("16");
      expect(svg.getAttribute("height")).toBe("16");
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("focusable")).toBe("false");
      expect(svg.querySelector("path").getAttribute("fill")).toBe(
        "currentColor",
      );
      expect(svg.querySelector("path").getAttribute("d")).toMatch(
        new RegExp(`^${pathStart}`),
      );
      expect(
        svg.querySelector("defs,clipPath,[id],[data-slot],[style]"),
      ).toBeNull();
      expect(svg.hasAttribute("style")).toBe(false);
      expect(svg.hasAttribute("data-slot")).toBe(false);
      expect([...svg.classList]).toEqual(["icon-button__icon"]);
    },
  );

  test("clicking an action label or SVG keeps menu associations and behavior intact", () => {
    initialize();
    expect(button("customizeButton").getAttribute("aria-controls")).toBe("app");
    button("customizeButton")
      .querySelector("path")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    remove("currency").click();
    const add = button("addWidgetButton");
    expect(add.getAttribute("aria-controls")).toBe("addWidgetMenu");
    add.querySelector("span").click();
    expect(button("addWidgetMenu").hidden).toBe(false);
    expect(add.getAttribute("aria-expanded")).toBe("true");
    button("addWidgetMenu").querySelector("button").click();
    expect(add.disabled).toBe(true);
    add
      .querySelector("svg")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(button("addWidgetMenu").hidden).toBe(true);
    button("cancelCustomizationButton").querySelector("span").click();
    expect(button("customizeButton").hidden).toBe(false);
  });

  test("restores saved desktop order and visibility without recreating any widget", () => {
    localStorage.setItem("dashboardLayout", JSON.stringify(storedCustom()));
    initialize();

    expect(visibleIds()).toEqual(["coffee", "date", "countdown"]);
    expect(widgets[1].container.hidden).toBe(true);
    expect(new Set(grid.children)).toEqual(
      new Set(widgets.map(({ container }) => container)),
    );
  });

  test.each(["phone", "tablet", "touch laptop"])(
    "keeps defaults and never reads or repairs desktop storage on a %s",
    (device) => {
      desktop.matches = device === "touch laptop";
      touch.matches = true;
      localStorage.setItem("dashboardLayout", "invalid desktop snapshot");
      const read = jest.spyOn(window.Storage.prototype, "getItem");
      const write = jest.spyOn(window.Storage.prototype, "setItem");
      const removeItem = jest.spyOn(window.Storage.prototype, "removeItem");
      initialize();
      begin();

      expect(toolbar.hidden).toBe(true);
      expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
      expect(grid.querySelector(".grid-widget")).toBeNull();
      expect(read).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
      expect(removeItem).not.toHaveBeenCalled();
      expect(beforeEdit).not.toHaveBeenCalled();
    },
  );

  test("disables editing on a narrow desktop viewport even without touch input", () => {
    desktop.matches = false;
    initialize();
    begin();

    expect(toolbar.hidden).toBe(true);
    expect(beforeEdit).not.toHaveBeenCalled();
    expect(grid.querySelector(".grid-widget")).toBeNull();
  });

  test("fails closed if media-query support is unavailable", () => {
    delete window.matchMedia;

    expect(initialize()).toBeNull();
    expect(toolbar.hidden).toBe(true);
    expect([...grid.children]).toEqual(
      widgets.map(({ container }) => container),
    );
  });

  test("wraps existing widgets, closes overlays, and exposes editor controls", () => {
    initialize();
    const containers = widgets.map(({ container }) => container);
    begin();

    expect(beforeEdit).toHaveBeenCalledTimes(1);
    expect(button("customizeButton").hidden).toBe(true);
    expect(button("saveLayoutButton").hidden).toBe(false);
    expect(button("cancelCustomizationButton").hidden).toBe(false);
    expect(button("resetLayoutButton").hidden).toBe(false);
    expect(button("addWidgetButton").disabled).toBe(true);
    expect(grid.querySelectorAll(".grid-widget")).toHaveLength(4);
    expect([...grid.querySelectorAll(".Container")]).toEqual(containers);
    expect(
      containers.every((container) => container.hasAttribute("inert")),
    ).toBe(true);
    expect(document.activeElement).toBe(button("saveLayoutButton"));
  });

  test("prevents content interaction and focus during editing and restores both on cancel", () => {
    const target = widgets[0].container.querySelector("button");
    const action = jest.fn();
    const hover = jest.fn();
    target.addEventListener("click", action);
    target.addEventListener("pointerover", hover);
    initialize();
    begin();
    target.click();
    target.dispatchEvent(
      new window.MouseEvent("pointerover", { bubbles: true }),
    );
    target.focus();

    expect(action).not.toHaveBeenCalled();
    expect(hover).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button("saveLayoutButton"));
    cancel();
    expect(widgets[0].container.hasAttribute("inert")).toBe(false);
    expect(grid.querySelector(".grid-widget")).toBeNull();
    target.click();
    target.focus();
    expect(action).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(target);
  });

  test("removes from the draft only, keeps one visible card, and restores a hidden card in place", () => {
    initialize();
    const write = jest.spyOn(window.Storage.prototype, "setItem");
    begin();
    remove("date").click();
    remove("currency").click();
    remove("coffee").click();

    expect(visibleIds()).toEqual(["countdown"]);
    expect(remove("countdown").hidden).toBe(true);
    remove("countdown").click();
    expect(visibleIds()).toEqual(["countdown"]);
    expect(write).not.toHaveBeenCalled();
    button("addWidgetButton").click();
    const menu = button("addWidgetMenu");
    expect(
      [...menu.querySelectorAll("button")].map((node) => node.textContent),
    ).toEqual(["DATE", "CURRENCY", "COFFEE"]);
    menu.querySelectorAll("button")[1].click();

    expect(visibleIds()).toEqual(["currency", "countdown"]);
    expect(remove("countdown").hidden).toBe(false);
    expect(menu.hidden).toBe(true);
    expect(button("saveLayoutButton").hidden).toBe(false);
  });

  test("disables Add when the final hidden widget is restored and returns focus to Save", () => {
    initialize();
    begin();
    remove("currency").click();
    button("addWidgetButton").click();
    button("addWidgetMenu").querySelector("button").click();

    expect(button("addWidgetButton").disabled).toBe(true);
    expect(document.activeElement).toBe(button("saveLayoutButton"));
    save();
    expect(localStorage.getItem("dashboardLayout")).toBeNull();
  });

  test("closes the Add list with Escape or an outside pointer without ending edit mode", () => {
    initialize();
    begin();
    remove("currency").click();
    const add = button("addWidgetButton");
    add.click();
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(button("addWidgetMenu").hidden).toBe(true);
    expect(document.activeElement).toBe(add);
    expect(button("saveLayoutButton").hidden).toBe(false);
    add.click();
    document.body.dispatchEvent(
      new window.MouseEvent("pointerdown", { bubbles: true }),
    );
    expect(button("addWidgetMenu").hidden).toBe(true);
    expect(add.getAttribute("aria-expanded")).toBe("false");
  });

  test("cancel after Reset restores the saved customization and leaves storage untouched", () => {
    const raw = JSON.stringify(storedCustom());
    localStorage.setItem("dashboardLayout", raw);
    initialize();
    begin();
    reset();

    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
    expect(button("saveLayoutButton").hidden).toBe(false);
    cancel();
    expect(visibleIds()).toEqual(["coffee", "date", "countdown"]);
    expect(localStorage.getItem("dashboardLayout")).toBe(raw);
    expect(document.activeElement).toBe(button("customizeButton"));
  });

  test("saves a custom snapshot and returns to the same live widget containers", () => {
    initialize();
    const action = jest.fn();
    const currencyButton = widgets[1].container.querySelector("button");
    currencyButton.addEventListener("click", action);
    begin();
    remove("date").click();
    save();

    const snapshot = JSON.parse(localStorage.getItem("dashboardLayout"));
    expect(snapshot).toEqual({
      version: 1,
      widgets: entries().map((entry) => ({
        ...entry,
        is_remove: entry.id === "date",
      })),
    });
    expect(grid.querySelector(".grid-widget")).toBeNull();
    expect(visibleIds()).toEqual(["currency", "coffee", "countdown"]);
    expect(
      widgets.every(
        ({ container }) =>
          container.parentElement === grid && !container.hasAttribute("inert"),
      ),
    ).toBe(true);
    currencyButton.click();
    expect(action).toHaveBeenCalledTimes(1);
    begin();
    expect(visibleIds()).toEqual(["currency", "coffee", "countdown"]);
  });

  test("unchanged save performs no writes; saving Reset removes a custom snapshot", () => {
    localStorage.setItem("dashboardLayout", JSON.stringify(storedCustom()));
    initialize();
    const write = jest.spyOn(window.Storage.prototype, "setItem");
    const removeItem = jest.spyOn(window.Storage.prototype, "removeItem");
    begin();
    save();
    expect(write).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    begin();
    reset();
    save();

    expect(removeItem).toHaveBeenCalledWith("dashboardLayout");
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem("dashboardLayout")).toBeNull();
    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
  });

  test.each(["setItem", "removeItem"])(
    "keeps the editor and draft after a failed %s and supports retry",
    (method) => {
      localStorage.setItem("dashboardLayout", JSON.stringify(storedCustom()));
      initialize();
      begin();
      reset();
      if (method === "setItem") remove("date").click();
      const draft = visibleIds();
      const failure = jest
        .spyOn(window.Storage.prototype, method)
        .mockImplementation(() => {
          throw new Error("Synthetic storage failure");
        });
      save();

      expect(button("saveLayoutButton").hidden).toBe(false);
      expect(toolbar.querySelector('[role="alert"]').hidden).toBe(false);
      expect(visibleIds()).toEqual(draft);
      expect(grid.querySelectorAll("[inert]")).toHaveLength(4);
      failure.mockRestore();
      save();
      expect(button("saveLayoutButton").hidden).toBe(true);
      expect(toolbar.querySelector('[role="alert"]').hidden).toBe(true);
      expect(visibleIds()).toEqual(draft);
    },
  );

  test("cancels unsaved edits when desktop support is lost and restores saved preferences on return", () => {
    const raw = JSON.stringify(storedCustom());
    localStorage.setItem("dashboardLayout", raw);
    initialize();
    begin();
    remove("coffee").click();
    desktop.change(false);

    expect(toolbar.hidden).toBe(true);
    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
    expect(grid.querySelector(".grid-widget")).toBeNull();
    expect(grid.querySelector("[inert]")).toBeNull();
    expect(localStorage.getItem("dashboardLayout")).toBe(raw);
    desktop.change(true);
    expect(visibleIds()).toEqual(["coffee", "date", "countdown"]);
    expect(toolbar.hidden).toBe(false);
    expect(button("saveLayoutButton").hidden).toBe(true);
    touch.change(true);
    expect(toolbar.hidden).toBe(true);
    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
  });

  test("loads desktop preferences only when a touch-free desktop becomes available", () => {
    const raw = JSON.stringify(storedCustom());
    localStorage.setItem("dashboardLayout", raw);
    desktop.matches = false;
    initialize();

    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
    desktop.change(true);
    expect(visibleIds()).toEqual(["coffee", "date", "countdown"]);
  });

  test("recovers from malformed desktop storage without affecting unrelated preferences", () => {
    localStorage.setItem("dashboardLayout", "invalid");
    localStorage.setItem("userCurrency", "EUR");
    initialize();

    expect(localStorage.getItem("dashboardLayout")).toBeNull();
    expect(localStorage.getItem("userCurrency")).toBe("EUR");
    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
  });

  test("renderer content replacement preserves edit controls and interaction blocking", () => {
    initialize();
    begin();
    const container = widgets[1].container;
    const action = jest.fn();
    const fresh = document.createElement("button");
    fresh.addEventListener("click", action);
    container.replaceChildren(fresh);
    fresh.click();

    expect(action).not.toHaveBeenCalled();
    expect(remove("currency").isConnected).toBe(true);
    expect(container.hasAttribute("inert")).toBe(true);
    cancel();
    fresh.click();
    expect(action).toHaveBeenCalledTimes(1);
  });

  test("reuses initialization and destroys listeners without changing stored preferences", () => {
    const first = initialize();
    expect(initialize()).toBe(first);
    const originalEdit = button("customizeButton");
    begin();
    expect(beforeEdit).toHaveBeenCalledTimes(1);
    remove("date").click();
    first.destroy();
    originalEdit.click();
    first.destroy();

    expect(grid.querySelector(".grid-widget")).toBeNull();
    expect(visibleIds()).toEqual(widgets.map(({ id }) => id));
    expect(localStorage.getItem("dashboardLayout")).toBeNull();
    expect(toolbar.hidden).toBe(true);
    touch.change(true);
    expect(toolbar.children).toHaveLength(0);
    expect(desktop.removeEventListener).toHaveBeenCalledTimes(1);
    expect(touch.removeEventListener).toHaveBeenCalledTimes(1);
    editor = null;
  });
});
