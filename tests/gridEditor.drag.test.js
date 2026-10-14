/** @jest-environment jsdom */

import { initializeGridEditor } from "../src/components/ui/gridEditor/gridEditor.js";

describe("desktop grid dragging", () => {
  let editor;
  let grid;
  let widgets;
  let frames;
  let scrollY;
  let reducedMotion;
  let desktop;
  let touch;
  let captured;
  let animations;
  const originalMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  const originalAnimate = Object.getOwnPropertyDescriptor(
    window.Element.prototype,
    "animate",
  );

  const button = (id) => document.getElementById(id);
  const shells = () => [...grid.children];
  const visible = () => shells().filter((node) => !node.hidden);
  const ids = () => visible().map((node) => node.dataset.widgetId);
  const shell = (id) => shells().find((node) => node.dataset.widgetId === id);
  const remove = (id) => shell(id).querySelector(".grid-widget__remove");
  const surface = (id) => shell(id).querySelector(".grid-widget__surface");

  function media(matches) {
    const listeners = new Set();
    return {
      matches,
      addEventListener: (type, listener) => listeners.add(listener),
      removeEventListener: (type, listener) => listeners.delete(listener),
      change(value) {
        this.matches = value;
        for (const listener of listeners) listener();
      },
    };
  }

  function rect(node) {
    const index = visible().indexOf(node);
    return {
      left: 124 + (index % 2) * 223,
      top: 124 + Math.floor(index / 2) * 223 - scrollY,
      width: 175,
      height: 175,
    };
  }

  function pointer(target, type, x, y, properties = {}) {
    const event = new window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      ...properties,
    });
    for (const [name, value] of Object.entries({
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      ...properties,
    }))
      Object.defineProperty(event, name, { value });
    target.dispatchEvent(event);
    return event;
  }

  function frame(time = 16) {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(time);
  }

  function start(id = "date") {
    const position = rect(shell(id));
    pointer(surface(id), "pointerdown", position.left + 80, position.top + 80);
  }

  function moveTo(index) {
    const position = rect(visible()[index]);
    pointer(grid, "pointermove", position.left + 80, position.top + 80);
    frame();
  }

  function drop(index) {
    const position = rect(visible()[index]);
    pointer(grid, "pointerup", position.left + 80, position.top + 80);
  }

  beforeEach(() => {
    editor = null;
    localStorage.clear();
    document.body.innerHTML = '<div id="toolbar"></div><div id="app"></div>';
    grid = button("app");
    widgets = ["date", "currency", "coffee", "countdown"].map((id) => {
      const container = document.createElement("div");
      container.className = "Container";
      container.dataset.widgetId = id;
      container.innerHTML = `<button>${id}</button>`;
      grid.append(container);
      return { id, name: id, container };
    });
    desktop = media(true);
    touch = media(false);
    reducedMotion = media(false);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query) =>
        query === "(prefers-reduced-motion: reduce)"
          ? reducedMotion
          : query === "(any-pointer: coarse)"
            ? touch
            : desktop,
    });
    animations = [];
    Object.defineProperty(window.Element.prototype, "animate", {
      configurable: true,
      value: jest.fn(() => {
        const animation = {
          cancel: jest.fn(() => animation.oncancel?.()),
        };
        animations.push(animation);
        return animation;
      }),
    });
    frames = new Map();
    let nextFrame = 0;
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      frames.delete(id);
    });
    scrollY = 0;
    jest.replaceProperty(window, "scrollY", 0);
    jest.spyOn(window, "scrollBy").mockImplementation((x, y) => {
      scrollY = Math.max(0, Math.min(400, scrollY + y));
      window.scrollY = scrollY;
    });
    grid.getBoundingClientRect = () => ({
      left: 100,
      top: 100 - scrollY,
      right: 546,
      bottom: 546 - scrollY,
      width: 446,
      height: 446,
    });
    captured = null;
    grid.setPointerCapture = jest.fn((id) => {
      captured = id;
    });
    grid.hasPointerCapture = (id) => id === captured;
    grid.releasePointerCapture = jest.fn((id) => {
      captured = null;
      pointer(grid, "lostpointercapture", 0, 0, { pointerId: id });
    });
    editor = initializeGridEditor(widgets, {
      grid,
      toolbar: button("toolbar"),
    });
    button("customizeButton").click();
    for (const node of shells()) {
      Object.defineProperties(node, {
        offsetLeft: { get: () => rect(node).left - 100 },
        offsetTop: { get: () => rect(node).top - 100 + scrollY },
        offsetWidth: { get: () => 175 },
        offsetHeight: { get: () => 175 },
      });
      node.getBoundingClientRect = () => rect(node);
      node.querySelector(".grid-widget__surface").getBoundingClientRect =
        () => {
          const position = rect(node);
          const value = node.querySelector(".grid-widget__surface").style
            .transform;
          const translation = value.match(
            /translate\(([-\d.]+)px, ([-\d.]+)px\)/,
          );
          return {
            ...position,
            left: position.left + Number(translation?.[1] ?? 0),
            top: position.top + Number(translation?.[2] ?? 0),
          };
        };
    }
  });

  afterEach(() => {
    editor?.destroy();
    jest.restoreAllMocks();
    if (originalMedia)
      Object.defineProperty(window, "matchMedia", originalMedia);
    else delete window.matchMedia;
    if (originalAnimate)
      Object.defineProperty(
        window.Element.prototype,
        "animate",
        originalAnimate,
      );
    else delete window.Element.prototype.animate;
    localStorage.clear();
    document.body.replaceChildren();
  });

  test("inserts across rows, shifts all intermediate cards, and persists only on Save", () => {
    const write = jest.spyOn(window.Storage.prototype, "setItem");
    const containers = widgets.map(({ container }) => container);
    start();
    moveTo(3);

    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
    expect(grid.classList.contains("grid--dragging")).toBe(true);
    expect(window.Element.prototype.animate).toHaveBeenCalledTimes(3);
    expect(write).not.toHaveBeenCalled();
    drop(3);
    expect(grid.classList.contains("grid--dragging")).toBe(false);
    expect(captured).toBeNull();
    expect(write).not.toHaveBeenCalled();
    button("saveLayoutButton").click();

    expect(
      JSON.parse(localStorage.getItem("dashboardLayout")).widgets.map(
        ({ id }) => id,
      ),
    ).toEqual(["currency", "coffee", "countdown", "date"]);
    expect([...grid.children]).toEqual([
      containers[1],
      containers[2],
      containers[3],
      containers[0],
    ]);
    expect(grid.classList.contains("grid--editing")).toBe(false);
    expect(frames.size).toBe(0);
  });

  test("does not reorder or animate a click or movement below the threshold", () => {
    start();
    pointer(grid, "pointermove", 206, 206);
    frame();
    pointer(grid, "pointerup", 206, 206);
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    expect(window.Element.prototype.animate).not.toHaveBeenCalled();
    expect(captured).toBeNull();
  });

  test("updates the drop target even when pointerup arrives before the next frame", () => {
    start("countdown");
    pointer(grid, "pointermove", 204, 204);
    pointer(grid, "pointerup", 204, 204);
    expect(ids()).toEqual(["countdown", "date", "currency", "coffee"]);
    expect(frames.size).toBe(0);
  });

  test("keeps the dragged card within the grid when the pointer leaves it", () => {
    start();
    pointer(grid, "pointermove", -500, -500);
    frame();
    expect(surface("date").getBoundingClientRect()).toMatchObject({
      left: 124,
      top: 124,
    });
    pointer(grid, "pointermove", 5000, 5000);
    frame();
    expect(surface("date").getBoundingClientRect()).toMatchObject({
      left: 347,
      top: 347,
    });
    pointer(grid, "pointerup", 5000, 5000);
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
  });

  test.each([
    "pointercancel",
    "lostpointercapture",
    "Escape",
    "blur",
    "resize",
  ])(
    "%s restores the exact draft before this gesture, including hidden positions",
    (reason) => {
      remove("currency").click();
      const before = shells().map((node) => node.dataset.widgetId);
      start();
      moveTo(2);
      if (reason === "Escape")
        document.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      else if (reason === "blur" || reason === "resize")
        window.dispatchEvent(new Event(reason));
      else pointer(grid, reason, 0, 0);

      expect(shells().map((node) => node.dataset.widgetId)).toEqual(before);
      expect(grid.classList.contains("grid--dragging")).toBe(false);
      expect(surface("date").style.transform).toBe("");
      expect(button("saveLayoutButton").hidden).toBe(false);
      expect(captured).toBeNull();
      expect(frames.size).toBe(0);
      button("addWidgetButton").click();
      button("addWidgetMenu").querySelector("button").click();
      expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    },
  );

  test("cancelling a second gesture preserves the previously completed move", () => {
    start();
    moveTo(3);
    drop(3);
    start("currency");
    moveTo(2);
    pointer(grid, "pointercancel", 0, 0);
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
    button("cancelCustomizationButton").click();
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    expect(localStorage.getItem("dashboardLayout")).toBeNull();
  });

  test.each([
    { pointerType: "touch" },
    { pointerType: "pen" },
    { button: 2 },
    { isPrimary: false },
  ])("ignores unsupported pointer input %j", (properties) => {
    pointer(surface("date"), "pointerdown", 204, 204, properties);
    moveTo(3);
    drop(3);
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    expect(grid.setPointerCapture).not.toHaveBeenCalled();
  });

  test("ignores a foreign pointer and cancels when the primary button is no longer held", () => {
    start();
    pointer(grid, "pointermove", 427, 427, { pointerId: 2 });
    frame();
    expect(ids()[0]).toBe("date");
    moveTo(3);
    pointer(grid, "pointermove", 427, 427, { buttons: 0 });
    expect(ids()[0]).toBe("date");
    expect(captured).toBeNull();
  });

  test("remove buttons remain usable immediately after a drop and never start dragging", () => {
    start();
    moveTo(3);
    drop(3);
    pointer(remove("currency"), "pointerdown", 347, 124);
    remove("currency").dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, detail: 1 }),
    );
    expect(ids()).toEqual(["coffee", "countdown", "date"]);
    expect(captured).toBeNull();
  });

  test("does not drag the final visible widget", () => {
    remove("currency").click();
    remove("coffee").click();
    remove("countdown").click();
    start();
    moveTo(0);
    drop(0);
    expect(ids()).toEqual(["date"]);
    expect(shell("date").classList.contains("grid-widget--fixed")).toBe(true);
    expect(grid.setPointerCapture).not.toHaveBeenCalled();
  });

  test("a failed pointer capture leaves the editor usable", () => {
    grid.setPointerCapture.mockImplementation(() => {
      throw new Error("Synthetic capture failure");
    });
    start();
    moveTo(3);
    drop(3);
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    remove("date").click();
    expect(ids()).toEqual(["currency", "coffee", "countdown"]);
  });

  test("a drop with hidden entries preserves the model's restore positions", () => {
    remove("currency").click();
    start();
    moveTo(2);
    drop(2);
    button("addWidgetButton").click();
    button("addWidgetMenu").querySelector("button").click();
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
    button("saveLayoutButton").click();
    expect(JSON.parse(localStorage.getItem("dashboardLayout")).widgets).toEqual(
      ["currency", "coffee", "countdown", "date"].map((id) => ({
        id,
        is_remove: false,
      })),
    );
  });

  test.each([
    "cancelCustomizationButton",
    "resetLayoutButton",
    "saveLayoutButton",
  ])("%s discards an unfinished gesture before acting", (id) => {
    start();
    moveTo(3);
    button(id).click();
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    expect(localStorage.getItem("dashboardLayout")).toBeNull();
    expect(captured).toBeNull();
    expect(frames.size).toBe(0);
  });

  test("losing desktop eligibility during a gesture restores default interactive containers", () => {
    start();
    moveTo(3);
    touch.change(true);
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    expect(grid.querySelector(".grid-widget")).toBeNull();
    expect(
      widgets.every(
        ({ container }) =>
          container.parentElement === grid && !container.hasAttribute("inert"),
      ),
    ).toBe(true);
    expect(captured).toBeNull();
    expect(frames.size).toBe(0);
  });

  test("reduced motion keeps reordering functional without movement animations", () => {
    reducedMotion.change(true);
    start();
    moveTo(3);
    drop(3);
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
    expect(window.Element.prototype.animate).not.toHaveBeenCalled();
  });

  test("a storage failure retains the dropped order and permits a later save", () => {
    start();
    moveTo(3);
    drop(3);
    const failure = jest
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Synthetic storage failure");
      });
    button("saveLayoutButton").click();
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
    expect(button("saveLayoutButton").hidden).toBe(false);
    expect(button("toolbar").querySelector('[role="alert"]').hidden).toBe(
      false,
    );
    failure.mockRestore();
    button("saveLayoutButton").click();
    expect(
      JSON.parse(localStorage.getItem("dashboardLayout")).widgets[3].id,
    ).toBe("date");
  });

  test("a stationary pointer does not oscillate between slots during sibling animations", () => {
    start();
    moveTo(3);
    for (let i = 0; i < 5; i++) {
      pointer(grid, "pointermove", 427, 427);
      frame();
      expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
    }
  });

  test("the last click from dragging cannot accidentally remove a card", () => {
    start();
    moveTo(3);
    drop(3);
    remove("currency").dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, detail: 1 }),
    );
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
  });

  test("changing reduced motion during an animation cancels it without cancelling the gesture", () => {
    start();
    moveTo(3);
    const activeAnimations = [...animations];
    reducedMotion.change(true);
    expect(
      activeAnimations.every(
        (animation) => animation.cancel.mock.calls.length > 0,
      ),
    ).toBe(true);
    drop(3);
    expect(ids()).toEqual(["currency", "coffee", "countdown", "date"]);
  });

  test("auto-scrolling stops once the grid end is visible", () => {
    jest.replaceProperty(window, "innerHeight", 300);
    start();
    pointer(grid, "pointermove", 204, 290);
    for (let time = 16; time < 1600 && frames.size; time += 16) frame(time);
    expect(scrollY).toBeGreaterThanOrEqual(246);
    expect(scrollY).toBeLessThan(256);
    expect(frames.size).toBe(0);
    expect(grid.classList.contains("grid--dragging")).toBe(true);
  });

  test("auto-scrolls near viewport edges, then stops on cancellation", () => {
    jest.replaceProperty(window, "innerHeight", 300);
    start();
    pointer(grid, "pointermove", 204, 290);
    frame();
    frame(32);
    expect(scrollY).toBeGreaterThan(0);
    expect(frames.size).toBe(1);
    pointer(grid, "pointercancel", 0, 0);
    const scroll = scrollY;
    frame(48);
    expect(scrollY).toBe(scroll);
    expect(frames.size).toBe(0);
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
  });

  test("destroy releases capture and stops all scheduled work and animations", () => {
    start();
    moveTo(3);
    const activeAnimations = [...animations];
    editor.destroy();
    expect(captured).toBeNull();
    expect(frames.size).toBe(0);
    expect(
      activeAnimations.every(
        (animation) => animation.cancel.mock.calls.length > 0,
      ),
    ).toBe(true);
    pointer(grid, "pointermove", 427, 427);
    frame();
    expect(ids()).toEqual(["date", "currency", "coffee", "countdown"]);
    expect(grid.querySelector(".grid-widget")).toBeNull();
  });
});
