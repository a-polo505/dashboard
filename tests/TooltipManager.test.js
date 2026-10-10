/** @jest-environment jsdom */

import { TooltipManager } from "../src/components/ui/tooltip/TooltipManager.js";
import { TimeWidget } from "../src/components/widgets/timeWidget/timeWidget.js";
import { TimeWidgetRenderer } from "../src/components/widgets/timeWidget/timeWidgetRender.js";
import { DateWidgetRenderer } from "../src/components/widgets/dateWidget/dateWidgetRender.js";
import { WeeksWidgetRenderer } from "../src/components/widgets/weeksWidget/weeksWidgetRender.js";

describe("managed tooltip subscriptions", () => {
  let managers;
  let touchDescriptor;
  let pointsDescriptor;
  let windowAdd;
  let windowRemove;
  let documentAdd;
  let documentRemove;

  function createManager(touch = false) {
    if (touch) {
      Object.defineProperty(window, "ontouchstart", {
        configurable: true,
        value: null,
      });
    }
    const manager = new TooltipManager();
    managers.push(manager);
    return manager;
  }

  function addTarget() {
    const element = document.createElement("button");
    element.innerHTML = "<span>Target</span>";
    document.body.appendChild(element);
    return element;
  }

  function hover(element) {
    element.dispatchEvent(
      new window.MouseEvent("mouseover", {
        bubbles: true,
        clientX: 20,
        clientY: 30,
      }),
    );
  }

  function callCount(spy, type, listener) {
    return spy.mock.calls.filter(
      ([event, callback]) => event === type && callback === listener,
    ).length;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 10, 12));
    document.body.innerHTML = '<div class="widgets"></div>';
    managers = [];
    touchDescriptor = Object.getOwnPropertyDescriptor(window, "ontouchstart");
    pointsDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "maxTouchPoints",
    );
    delete window.ontouchstart;
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    windowAdd = jest.spyOn(window, "addEventListener");
    windowRemove = jest.spyOn(window, "removeEventListener");
    documentAdd = jest.spyOn(document, "addEventListener");
    documentRemove = jest.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    for (const manager of managers) manager.clearInteractions();
    if (touchDescriptor)
      Object.defineProperty(window, "ontouchstart", touchDescriptor);
    else delete window.ontouchstart;
    if (pointsDescriptor)
      Object.defineProperty(navigator, "maxTouchPoints", pointsDescriptor);
    else delete navigator.maxTouchPoints;
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("does not subscribe globally until an interaction is registered", () => {
    const manager = createManager();
    expect(manager.isTouchDevice).toBe(false);
    expect(windowAdd).not.toHaveBeenCalled();
    expect(documentAdd).not.toHaveBeenCalled();
  });

  test.each([false, true])(
    "uses one global subscription per event for 54 targets (touch=%s)",
    (touch) => {
      const manager = createManager(touch);
      for (let week = 1; week <= 54; week++)
        manager.handleInteraction(addTarget(), `Week ${week}`);

      expect(callCount(windowAdd, "scroll", manager.onScroll)).toBe(1);
      expect(callCount(documentAdd, "click", manager.onOutsideClick)).toBe(
        touch ? 1 : 0,
      );
      expect(manager.interactions.size).toBe(54);
    },
  );

  test("preserves desktop hover, HTML content, positioning, and custom class", () => {
    const manager = createManager();
    const element = addTarget();
    manager.handleInteraction(element, "<p>Details</p>", "info-tooltip");

    hover(element);

    expect(manager.tooltipElement.innerHTML).toBe("<p>Details</p>");
    expect(manager.tooltipElement.classList).toContain("info-tooltip");
    expect(manager.tooltipElement.style.left).toBe("20px");
    expect(manager.tooltipElement.style.top).toBe("30px");
    expect(manager.tooltipElement.classList).not.toContain("visible");
    jest.advanceTimersByTime(10);
    expect(manager.tooltipElement.classList).toContain("visible");
    element.dispatchEvent(new window.MouseEvent("mouseleave"));
    expect(document.querySelector(".tooltip")).toBeNull();
    expect(manager.isTooltipVisible).toBe(false);
  });

  test("scroll hides a desktop tooltip and leaves the target usable", () => {
    const manager = createManager();
    const element = addTarget();
    manager.handleInteraction(element, "Details");
    hover(element);

    window.dispatchEvent(new Event("scroll"));

    expect(manager.tooltipElement).toBeNull();
    hover(element);
    expect(manager.tooltipElement.textContent).toBe("Details");
  });

  test("replaces desktop bindings without duplicates or stale text", () => {
    const manager = createManager();
    const element = addTarget();
    manager.handleInteraction(element, "Old");
    hover(element);
    manager.handleInteraction(element, "New");

    hover(element);

    expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
    expect(manager.tooltipElement.textContent).toBe("New");
    expect(manager.interactions.size).toBe(1);
    expect(callCount(windowAdd, "scroll", manager.onScroll)).toBe(1);
  });

  test("tracks the active target when moving directly between elements", () => {
    const manager = createManager();
    const first = addTarget();
    const second = addTarget();
    manager.handleInteraction(first, "First");
    manager.handleInteraction(second, "Second");
    hover(first);
    hover(second);
    first.dispatchEvent(new window.MouseEvent("mouseleave"));

    expect(manager.tooltipElement.textContent).toBe("Second");
    second.dispatchEvent(new window.MouseEvent("mouseleave"));
    expect(manager.tooltipElement).toBeNull();
  });

  test("preserves touch toggle, outside-click dismissal, and scroll dismissal", () => {
    const manager = createManager(true);
    const first = addTarget();
    const second = addTarget();
    manager.handleInteraction(first, "First");
    manager.handleInteraction(second, "Second");

    first.querySelector("span").click();
    expect(manager.tooltipElement.textContent).toBe("First");
    first.click();
    expect(manager.tooltipElement).toBeNull();
    second.click();
    expect(manager.tooltipElement.textContent).toBe("Second");
    document.body.click();
    expect(manager.tooltipElement).toBeNull();
    second.click();
    window.dispatchEvent(new Event("scroll"));
    expect(manager.tooltipElement).toBeNull();
  });

  test("preserves touch behavior when another target is clicked while visible", () => {
    const manager = createManager(true);
    const first = addTarget();
    const second = addTarget();
    manager.handleInteraction(first, "First");
    manager.handleInteraction(second, "Second");
    first.click();

    second.click();

    expect(manager.tooltipElement).toBeNull();
    second.click();
    expect(manager.tooltipElement.textContent).toBe("Second");
  });

  test("replaces touch bindings without toggling twice on a single click", () => {
    const manager = createManager(true);
    const element = addTarget();
    manager.handleInteraction(element, "Old");
    manager.handleInteraction(element, "New");

    element.click();

    expect(manager.tooltipElement.textContent).toBe("New");
    expect(callCount(documentAdd, "click", manager.onOutsideClick)).toBe(1);
  });

  test.each([false, true])(
    "clears element handlers, globals, visible tooltip, and animation timer (touch=%s)",
    (touch) => {
      const manager = createManager(touch);
      const element = addTarget();
      manager.handleInteraction(element, "Details");
      if (touch) element.click();
      else hover(element);
      expect(jest.getTimerCount()).toBe(1);

      manager.clearInteractions();
      manager.clearInteractions();
      element.remove();
      if (touch) element.click();
      else hover(element);
      jest.runOnlyPendingTimers();

      expect(manager.interactions.size).toBe(0);
      expect(manager.activeElement).toBeNull();
      expect(document.querySelector(".tooltip")).toBeNull();
      expect(jest.getTimerCount()).toBe(0);
      expect(callCount(windowRemove, "scroll", manager.onScroll)).toBe(1);
      expect(callCount(documentRemove, "click", manager.onOutsideClick)).toBe(
        touch ? 1 : 0,
      );
    },
  );

  test("can be reused after cleanup without retaining old targets", () => {
    const manager = createManager();
    const oldElement = addTarget();
    manager.handleInteraction(oldElement, "Old");
    manager.clearInteractions();
    const newElement = addTarget();
    manager.handleInteraction(newElement, "New");
    hover(oldElement);
    expect(manager.tooltipElement).toBeNull();

    hover(newElement);

    expect(manager.tooltipElement.textContent).toBe("New");
    expect(manager.interactions.size).toBe(1);
    expect(callCount(windowAdd, "scroll", manager.onScroll)).toBe(2);
    expect(callCount(windowRemove, "scroll", manager.onScroll)).toBe(1);
  });

  test("cancels the old animation timer before showing a new tooltip", () => {
    const manager = createManager();
    const first = addTarget();
    const second = addTarget();
    manager.handleInteraction(first, "First");
    manager.handleInteraction(second, "Second");
    hover(first);
    jest.advanceTimersByTime(5);
    hover(second);

    jest.advanceTimersByTime(5);

    expect(manager.tooltipElement.classList).not.toContain("visible");
    jest.advanceTimersByTime(5);
    expect(manager.tooltipElement.classList).toContain("visible");
  });

  test("clearing one manager does not remove another manager's tooltip or bindings", () => {
    const first = createManager();
    const second = createManager();
    const firstTarget = addTarget();
    const secondTarget = addTarget();
    first.handleInteraction(firstTarget, "First");
    second.handleInteraction(secondTarget, "Second");
    hover(firstTarget);
    hover(secondTarget);

    first.clearInteractions();

    expect(second.tooltipElement.textContent).toBe("Second");
    window.dispatchEvent(new Event("scroll"));
    expect(second.tooltipElement).toBeNull();
    hover(secondTarget);
    expect(second.tooltipElement.textContent).toBe("Second");
  });

  test.each([
    ["time", TimeWidgetRenderer, "path", 2],
    ["date", DateWidgetRenderer, ".date--day", 1],
    ["weeks", WeeksWidgetRenderer, ".grid-item", 53],
  ])(
    "cleans old %s renderer bindings before repeated rendering",
    (name, Renderer, selector, count) => {
      const renderer = new Renderer();
      const manager = renderer.tooltipManager;
      managers.push(manager);
      const oldContent = renderer.render(50);
      document.body.appendChild(oldContent);
      const oldTarget = oldContent.querySelector(selector);
      hover(oldTarget);

      const newContent = renderer.render(60);
      oldContent.replaceWith(newContent);

      expect(manager.tooltipElement).toBeNull();
      expect(manager.interactions.size).toBe(count);
      hover(oldTarget);
      expect(manager.tooltipElement).toBeNull();
      hover(newContent.querySelector(selector));
      expect(manager.isTooltipVisible).toBe(true);
      expect(
        callCount(windowAdd, "scroll", manager.onScroll) -
          callCount(windowRemove, "scroll", manager.onScroll),
      ).toBe(1);
    },
  );

  test.each([false, true])(
    "timer-driven time widget refresh keeps only current handlers (touch=%s)",
    (touch) => {
      if (touch) {
        Object.defineProperty(window, "ontouchstart", {
          configurable: true,
          value: null,
        });
      }
      const widget = new TimeWidget();
      const manager = widget.timeWidgetRenderer.tooltipManager;
      managers.push(manager);
      const oldPath = document.querySelector(".time-widget-container path");
      if (touch)
        oldPath.dispatchEvent(
          new window.MouseEvent("click", { bubbles: true }),
        );
      else hover(oldPath);

      jest.advanceTimersByTime(4 * 5 * 60 * 1000);

      expect(manager.interactions.size).toBe(2);
      expect(document.querySelectorAll(".time-widget-container")).toHaveLength(
        1,
      );
      expect(manager.tooltipElement).toBeNull();
      if (touch)
        oldPath.dispatchEvent(
          new window.MouseEvent("click", { bubbles: true }),
        );
      else hover(oldPath);
      expect(manager.tooltipElement).toBeNull();
      const currentPath = document.querySelector(".time-widget-container path");
      if (touch)
        currentPath.dispatchEvent(
          new window.MouseEvent("click", { bubbles: true }),
        );
      else hover(currentPath);
      expect(manager.tooltipElement.textContent).toContain(
        "Remaining time until end of day:",
      );
      expect(
        callCount(windowAdd, "scroll", manager.onScroll) -
          callCount(windowRemove, "scroll", manager.onScroll),
      ).toBe(1);
      expect(
        callCount(documentAdd, "click", manager.onOutsideClick) -
          callCount(documentRemove, "click", manager.onOutsideClick),
      ).toBe(touch ? 1 : 0);
    },
  );
});
