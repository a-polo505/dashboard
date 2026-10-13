/** @jest-environment jsdom */

describe("currency menu initialization on opening", () => {
  let showContextMenu;
  let closeContextMenu;
  let documentAdd;
  let documentRemove;
  let trigger;

  function loadModule() {
    ({ showContextMenu, closeContextMenu } = jest.requireActual(
      "../src/components/ui/contextMenu/currencyContextMenu.js",
    ));
  }

  function mountPage() {
    document.body.innerHTML = `
      <button>USD / UAH</button>
      <div id="contextMenuContainer"></div>
    `;
    trigger = document.querySelector("button");
    return document.getElementById("contextMenuContainer");
  }

  function menuCodes() {
    return Array.from(
      document.querySelectorAll("#contextMenu button"),
      (button) => button.textContent,
    );
  }

  function listenerCount(spy, type) {
    return spy.mock.calls.filter(([event]) => event === type).length;
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    document.body.innerHTML = "";
    closeContextMenu = undefined;
    trigger = undefined;
    documentAdd = jest.spyOn(document, "addEventListener");
    documentRemove = jest.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    closeContextMenu?.();
    // Also isolate the old implementation while running regression tests.
    for (const [type, listener, options] of documentAdd.mock.calls) {
      document.removeEventListener(type, listener, options);
    }
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test.each([false, true])(
    "import does not query or modify DOM, subscribe, or start timers (container=%s)",
    (hasContainer) => {
      if (hasContainer) mountPage();
      const originalHTML = document.body.innerHTML;
      const lookup = jest.spyOn(document, "getElementById");

      loadModule();

      expect(lookup).not.toHaveBeenCalled();
      expect(documentAdd).not.toHaveBeenCalled();
      expect(document.body.innerHTML).toBe(originalHTML);
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  test("can import before the page exists and open after mounting it", () => {
    loadModule();
    const container = mountPage();

    showContextMenu(["USD", "UAH", "EUR"], trigger);

    expect(document.querySelectorAll("#contextMenuContainer")).toHaveLength(1);
    expect(document.getElementById("contextMenuContainer")).toBe(container);
    expect(menuCodes()).toEqual(["USD", "UAH", "EUR"]);
    expect(container.classList).toContain("open");
  });

  test("reports a missing container without subscribing and allows a later retry", () => {
    loadModule();

    expect(() =>
      showContextMenu(["USD", "UAH"], document.createElement("button")),
    ).toThrow("Currency context menu container not found");
    expect(documentAdd).not.toHaveBeenCalled();
    expect(document.body.children).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);

    mountPage();
    showContextMenu(["USD", "UAH"], trigger);
    expect(menuCodes()).toEqual(["USD", "UAH"]);
  });

  test.each([undefined, null, [], "USD", {}])(
    "ignores unusable currency codes without needing a container (%s)",
    (codes) => {
      loadModule();
      const lookup = jest.spyOn(document, "getElementById");

      showContextMenu(codes);
      closeContextMenu();

      expect(lookup).not.toHaveBeenCalled();
      expect(document.body.children).toHaveLength(0);
      expect(documentAdd).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  test.each([undefined, null, {}])(
    "rejects an unusable trigger before changing the menu and allows a retry (%s)",
    (invalidTrigger) => {
      loadModule();
      const container = mountPage();
      const originalHTML = container.innerHTML;

      expect(() => showContextMenu(["USD", "UAH"], invalidTrigger)).toThrow(
        "Currency context menu trigger not found",
      );
      expect(container.innerHTML).toBe(originalHTML);
      expect(container.classList.contains("open")).toBe(false);
      expect(documentAdd).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);

      showContextMenu(["USD", "UAH"], trigger);
      expect(menuCodes()).toEqual(["USD", "UAH"]);
    },
  );

  test("positions the menu and closing animation at the supplied trigger despite a global ID match", () => {
    loadModule();
    const container = mountPage();
    const decoy = document.createElement("button");
    decoy.id = "currencyPair";
    document.body.prepend(decoy);
    const decoyRect = jest.spyOn(decoy, "getBoundingClientRect");
    const triggerRect = jest
      .spyOn(trigger, "getBoundingClientRect")
      .mockReturnValue({ left: 120, bottom: 80 });
    jest.replaceProperty(window, "scrollX", 10);
    jest.replaceProperty(window, "scrollY", 20);

    showContextMenu(["USD", "UAH"], trigger);
    expect(container.style.left).toBe("130px");
    expect(container.style.top).toBe("100px");

    triggerRect.mockReturnValue({ left: 140, bottom: 90 });
    closeContextMenu();
    const circle = document.querySelector(".animation-circle");
    expect(circle.style.left).toBe("150px");
    expect(circle.style.top).toBe("110px");
    expect(decoyRect).not.toHaveBeenCalled();
    expect(container.isConnected).toBe(false);
    jest.advanceTimersByTime(300);
    expect(circle.isConnected).toBe(false);
  });

  test("uses the latest supplied trigger when an open menu is opened again", () => {
    loadModule();
    const container = mountPage();
    jest
      .spyOn(trigger, "getBoundingClientRect")
      .mockReturnValue({ left: 10, bottom: 20 });
    showContextMenu(["USD", "UAH"], trigger);

    const nextTrigger = document.createElement("button");
    document.body.appendChild(nextTrigger);
    jest
      .spyOn(nextTrigger, "getBoundingClientRect")
      .mockReturnValue({ left: 200, bottom: 300 });
    showContextMenu(["USD", "EUR"], nextTrigger);
    expect(container.style.left).toBe("200px");
    expect(container.style.top).toBe("300px");
    expect(menuCodes()).toEqual(["USD", "EUR"]);
    closeContextMenu();
    const circle = document.querySelector(".animation-circle");
    expect(circle.style.left).toBe("200px");
    expect(circle.style.top).toBe("300px");
    for (const type of ["mousedown", "keydown"]) {
      expect(listenerCount(documentAdd, type)).toBe(1);
      expect(listenerCount(documentRemove, type)).toBe(1);
    }
  });

  test("reuses the detached container and balances subscriptions across repeated opening", () => {
    loadModule();
    const container = mountPage();

    for (let cycle = 1; cycle <= 3; cycle++) {
      showContextMenu(["USD", "UAH", "EUR"], trigger);
      showContextMenu(["USD", "GBP"], trigger);
      expect(document.querySelectorAll("#contextMenuContainer")).toHaveLength(
        1,
      );
      expect(document.getElementById("contextMenuContainer")).toBe(container);
      expect(menuCodes()).toEqual(["USD", "GBP"]);
      for (const type of ["mousedown", "keydown"]) {
        expect(listenerCount(documentAdd, type)).toBe(cycle);
        expect(listenerCount(documentRemove, type)).toBe(cycle - 1);
      }

      closeContextMenu();
      closeContextMenu();
      expect(container.isConnected).toBe(false);
      for (const type of ["mousedown", "keydown"]) {
        expect(listenerCount(documentRemove, type)).toBe(cycle);
      }
      jest.advanceTimersByTime(300);
      expect(document.querySelector(".animation-circle")).toBeNull();
    }
  });

  test("preserves search, currency selection and closing after choosing a result", () => {
    loadModule();
    mountPage();
    const changed = jest.fn();
    document.addEventListener("currencyChange", changed);

    try {
      showContextMenu(["USD", "UAH", "EUR"], trigger);
      const search = document.querySelector(".context-menu-search");
      search.value = "e";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      expect(menuCodes()).toEqual(["EUR"]);
      document.querySelector("#contextMenu button").click();

      expect(changed).toHaveBeenCalledTimes(1);
      expect(changed.mock.calls[0][0].detail).toEqual({ userCurrency: "EUR" });
      expect(document.querySelector("#contextMenu")).toBeNull();
    } finally {
      document.removeEventListener("currencyChange", changed);
    }
  });

  test("preserves Escape from search and outside-click dismissal after reopening", () => {
    loadModule();
    mountPage();
    showContextMenu(["USD", "UAH"], trigger);
    const search = document.querySelector(".context-menu-search");
    const list = document.querySelector("#contextMenu ul");
    search.focus();
    const escape = () => {
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    };

    escape();
    expect(document.activeElement).toBe(list);
    expect(document.querySelector("#contextMenu")).not.toBeNull();
    escape();
    expect(document.querySelector("#contextMenu")).toBeNull();
    showContextMenu(["USD", "UAH"], trigger);
    document
      .querySelector("#contextMenu button")
      .dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true }));
    expect(document.querySelector("#contextMenu")).not.toBeNull();
    document.body.dispatchEvent(
      new window.MouseEvent("mousedown", { bubbles: true }),
    );
    expect(document.querySelector("#contextMenu")).toBeNull();
  });
});
