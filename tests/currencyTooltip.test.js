/** @jest-environment jsdom */

jest.mock("../src/components/ui/contextMenu/currencyContextMenu.js", () => ({
  showContextMenu: jest.fn(),
  closeContextMenu: jest.fn(),
}));

const firstUpdate = "2026-10-10T09:00:00.000Z";
const nextUpdate = "2026-10-11T09:00:00.000Z";
const historicalRates = [{ data: { UAH: { code: "UAH", value: 40 } } }];

function rates(lastUpdated = firstUpdate) {
  return [
    {
      lastUpdated,
      data: { USD: { code: "USD", value: 1 }, UAH: { code: "UAH", value: 41 } },
    },
  ];
}

function expectedText(lastUpdated) {
  return `Last updated: ${new Date(lastUpdated).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })}`;
}

describe.each([false, true])(
  "currency tooltip integration (touch=%s)",
  (touch) => {
    let display;
    let TooltipManager;
    let otherManager;
    let touchDescriptor;
    let pointsDescriptor;
    let windowAdd;
    let windowRemove;
    let documentAdd;
    let documentRemove;

    function pointer(element, type, pointerType) {
      const event = new window.MouseEvent(type, {
        bubbles: true,
        clientX: 20,
        clientY: 30,
      });
      Object.defineProperty(event, "pointerType", { value: pointerType });
      element.dispatchEvent(event);
    }

    function open(element = document.getElementById("percentageChange")) {
      pointer(element, "pointerover", touch ? "touch" : "mouse");
      if (touch) {
        pointer(element, "pointerdown", "touch");
        pointer(element, "pointerup", "touch");
        element.dispatchEvent(
          new window.MouseEvent("click", { bubbles: true }),
        );
      }
    }

    function tooltip() {
      return document.querySelector(".tooltip");
    }

    function renderRates(lastUpdated = firstUpdate) {
      sessionStorage.setItem("currencies", JSON.stringify(rates(lastUpdated)));
      display.renderCurrencyContainer({
        currencies: rates(lastUpdated),
        currenciesDiff: historicalRates,
      });
    }

    function count(spy, type) {
      return spy.mock.calls.filter(([event]) => event === type).length;
    }

    beforeEach(() => {
      jest.resetModules();
      jest.useFakeTimers();
      document.body.innerHTML = '<div class="widgets"></div>';
      localStorage.clear();
      sessionStorage.clear();
      touchDescriptor = Object.getOwnPropertyDescriptor(window, "ontouchstart");
      pointsDescriptor = Object.getOwnPropertyDescriptor(
        navigator,
        "maxTouchPoints",
      );
      delete window.ontouchstart;
      Object.defineProperty(navigator, "maxTouchPoints", {
        configurable: true,
        value: touch ? 1 : 0,
      });
      windowAdd = jest.spyOn(window, "addEventListener");
      windowRemove = jest.spyOn(window, "removeEventListener");
      documentAdd = jest.spyOn(document, "addEventListener");
      documentRemove = jest.spyOn(document, "removeEventListener");
      jest.spyOn(console, "error").mockImplementation(() => {});
      display = jest.requireActual("../src/utils/displayCurrencyUtils.js");
      ({ TooltipManager } = jest.requireActual(
        "../src/components/ui/tooltip/TooltipManager.js",
      ));
      otherManager = null;
      display.mountCurrencyWidget();
    });

    afterEach(() => {
      display.renderCurrencyLoading();
      otherManager?.clearInteractions();
      for (const [type, listener] of documentAdd.mock.calls) {
        if (type === "currencyChange")
          document.removeEventListener(type, listener);
      }
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

    test("preserves last-update text and uses shared show/hide behavior", () => {
      renderRates();
      open(document.querySelector("#percentageChange path"));
      expect(tooltip().textContent).toBe(expectedText(firstUpdate));
      expect(tooltip().classList.contains("visible")).toBe(false);
      jest.advanceTimersByTime(10);
      expect(tooltip().classList.contains("visible")).toBe(true);
      if (touch) document.body.click();
      else {
        pointer(
          document.getElementById("percentageChange"),
          "pointerleave",
          "mouse",
        );
        jest.advanceTimersByTime(150);
      }
      expect(tooltip()).toBeNull();
      open();
      window.dispatchEvent(new Event("scroll"));
      expect(tooltip()).toBeNull();
      expect(document.getElementById("rate").textContent).toBe("41");
    });

    test("uses the displayed snapshot even when the cache contains older data", () => {
      sessionStorage.setItem("currencies", JSON.stringify(rates()));
      display.renderCurrencyContainer({
        currencies: rates(nextUpdate),
        currenciesDiff: historicalRates,
      });
      // The fetch flow writes the fresh cache only after rendering.
      sessionStorage.setItem("currencies", JSON.stringify(rates(nextUpdate)));
      open();
      expect(tooltip().textContent).toBe(expectedText(nextUpdate));
      window.dispatchEvent(new Event("scroll"));
      sessionStorage.setItem("currencies", JSON.stringify(rates(firstUpdate)));
      open();
      expect(tooltip().textContent).toBe(expectedText(nextUpdate));
    });

    test.each([null, "[]", JSON.stringify(rates(null)), "broken JSON"])(
      "preserves the displayed last-update date despite unusable cache (%s)",
      (cache) => {
        renderRates();
        if (cache === null) sessionStorage.removeItem("currencies");
        else sessionStorage.setItem("currencies", cache);
        open();
        expect(tooltip().textContent).toBe(expectedText(firstUpdate));
      },
    );

    test("can open when browser storage becomes unavailable", () => {
      renderRates();
      jest.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      open();
      expect(tooltip().textContent).toBe(expectedText(firstUpdate));
    });

    test("uses the existing fallback if the loaded snapshot has no update date", () => {
      renderRates(null);
      open();
      expect(tooltip().textContent).toBe("Last updated: A long time ago 😔");
    });

    test("repeated hovers or taps and rerenders do not accumulate global subscriptions", () => {
      renderRates();
      const oldElement = document.getElementById("percentageChange");
      for (let index = 0; index < 10; index++) {
        open();
        window.dispatchEvent(new Event("scroll"));
      }
      expect(count(windowAdd, "scroll")).toBe(1);
      expect(count(documentAdd, "click")).toBe(1);
      for (let index = 0; index < 5; index++) renderRates();
      open(oldElement);
      expect(tooltip()).toBeNull();
      open();
      expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
      expect(count(windowAdd, "scroll") - count(windowRemove, "scroll")).toBe(
        1,
      );
      expect(count(documentAdd, "click") - count(documentRemove, "click")).toBe(
        1,
      );
    });

    test.each(["rates", "loading", "error"])(
      "cleans the old tooltip, timer, and target before showing %s",
      (state) => {
        renderRates();
        const oldElement = document.getElementById("percentageChange");
        open();
        expect(jest.getTimerCount()).toBe(1);
        if (state === "rates") renderRates(nextUpdate);
        else if (state === "loading") display.renderCurrencyLoading();
        else display.renderCurrencyError(jest.fn());
        expect(tooltip()).toBeNull();
        expect(jest.getTimerCount()).toBe(0);
        open(oldElement);
        expect(tooltip()).toBeNull();
        const active = state === "rates" ? 1 : 0;
        expect(count(windowAdd, "scroll") - count(windowRemove, "scroll")).toBe(
          active,
        );
        expect(
          count(documentAdd, "click") - count(documentRemove, "click"),
        ).toBe(active);
        renderRates(nextUpdate);
        open();
        expect(tooltip().textContent).toBe(expectedText(nextUpdate));
      },
    );

    test("switches between widgets and keeps another widget active during currency rerender", () => {
      const otherTarget = document.createElement("button");
      document.body.appendChild(otherTarget);
      otherManager = new TooltipManager();
      otherManager.handleInteraction(otherTarget, "Another widget");
      renderRates();
      open();
      const currencyTooltip = tooltip();
      open(otherTarget);
      const otherTooltip = otherManager.tooltipElement;
      expect(currencyTooltip.isConnected).toBe(false);
      expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
      expect(otherTooltip.textContent).toBe("Another widget");

      for (const render of [
        () => renderRates(nextUpdate),
        () => display.renderCurrencyLoading(),
        () => display.renderCurrencyError(jest.fn()),
      ]) {
        render();
        expect(otherManager.tooltipElement).toBe(otherTooltip);
        expect(otherTooltip.isConnected).toBe(true);
        expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
      }

      renderRates(nextUpdate);
      open();
      expect(otherTooltip.isConnected).toBe(false);
      expect(otherManager.tooltipElement).toBeNull();
      expect(tooltip().textContent).toBe(expectedText(nextUpdate));
      expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
    });

    test("preserves the currency selection button handler", () => {
      renderRates();
      document.getElementById("currencyPair").click();
      expect(
        jest.requireMock(
          "../src/components/ui/contextMenu/currencyContextMenu.js",
        ).showContextMenu,
      ).toHaveBeenCalledTimes(1);
    });
  },
);
