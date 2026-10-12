/** @jest-environment jsdom */

describe("explicit information tooltip initialization", () => {
  let initializeInfoTooltip;
  let handleInteraction;
  let documentAdd;
  let windowAdd;
  let elementAdd;

  function mountIcon() {
    const icon = document.createElement("div");
    icon.className = "info-icon";
    icon.innerHTML = "<svg><path></path></svg>";
    document.body.appendChild(icon);
    return icon;
  }

  function pointer(element, type, pointerType) {
    const event = new window.MouseEvent(type, {
      bubbles: true,
      clientX: 20,
      clientY: 30,
    });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    element.dispatchEvent(event);
  }

  function loadModule() {
    ({ initializeInfoTooltip } = jest.requireActual(
      "../src/components/ui/tooltip/infoTooltip.js",
    ));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    document.body.innerHTML = "";
    const { TooltipManager } = jest.requireActual(
      "../src/components/ui/tooltip/TooltipManager.js",
    );
    handleInteraction = jest.spyOn(
      TooltipManager.prototype,
      "handleInteraction",
    );
    documentAdd = jest.spyOn(document, "addEventListener");
    windowAdd = jest.spyOn(window, "addEventListener");
    elementAdd = jest.spyOn(window.Element.prototype, "addEventListener");
  });

  afterEach(() => {
    for (const manager of new Set(handleInteraction.mock.contexts)) {
      manager.clearInteractions();
    }
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test.each([false, true])(
    "import does not query or modify DOM, subscribe, or start timers (icon=%s)",
    (hasIcon) => {
      if (hasIcon) mountIcon();
      const originalHTML = document.body.innerHTML;
      const query = jest.spyOn(document, "querySelector");

      loadModule();

      expect(query).not.toHaveBeenCalled();
      expect(handleInteraction).not.toHaveBeenCalled();
      expect(documentAdd).not.toHaveBeenCalled();
      expect(windowAdd).not.toHaveBeenCalled();
      expect(elementAdd).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
      expect(document.body.innerHTML).toBe(originalHTML);
    },
  );

  test("permits initialization after the initially missing icon is mounted", () => {
    loadModule();
    initializeInfoTooltip();
    expect(handleInteraction).not.toHaveBeenCalled();
    expect(documentAdd).not.toHaveBeenCalled();
    expect(windowAdd).not.toHaveBeenCalled();

    const icon = mountIcon();
    initializeInfoTooltip();
    pointer(icon, "pointerover", "mouse");

    expect(handleInteraction).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".info-tooltip").textContent).toContain(
      "Welcome to Widget Dashboard ✨",
    );
  });

  test.each(["mouse", "touch"])(
    "repeated initialization keeps one subscription and preserves %s interaction",
    (pointerType) => {
      const icon = mountIcon();
      const target = icon.querySelector("path");
      loadModule();
      initializeInfoTooltip();
      const documentListeners = documentAdd.mock.calls.length;
      const windowListeners = windowAdd.mock.calls.length;
      const elementListeners = elementAdd.mock.calls.length;
      initializeInfoTooltip();
      expect(handleInteraction).toHaveBeenCalledTimes(1);
      expect(documentAdd).toHaveBeenCalledTimes(documentListeners);
      expect(windowAdd).toHaveBeenCalledTimes(windowListeners);
      expect(elementAdd).toHaveBeenCalledTimes(elementListeners);

      const open = () => {
        pointer(target, "pointerover", pointerType);
        if (pointerType === "touch") {
          pointer(target, "pointerdown", "touch");
          pointer(target, "pointerup", "touch");
          // Preserve the Safari workaround when click is misreported as mouse.
          pointer(target, "click", "mouse");
        }
      };
      open();
      const tooltip = document.querySelector(".info-tooltip");
      expect(tooltip).not.toBeNull();
      expect(tooltip.querySelectorAll("p")).toHaveLength(3);
      expect(tooltip.textContent).toContain("Created just for fun.");
      jest.advanceTimersByTime(10);
      expect(tooltip.classList).toContain("visible");
      initializeInfoTooltip();
      expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
      expect(document.querySelector(".info-tooltip")).toBe(tooltip);

      if (pointerType === "touch") open();
      else {
        pointer(icon, "pointerleave", "mouse");
        jest.advanceTimersByTime(150);
      }
      expect(document.querySelector(".tooltip")).toBeNull();
      open();
      document.body.click();
      expect(document.querySelector(".tooltip")).toBeNull();
      open();
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      expect(document.querySelector(".tooltip")).toBeNull();
      expect(jest.getTimerCount()).toBe(0);
    },
  );
});
