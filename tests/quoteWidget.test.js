/** @jest-environment jsdom */

import { QuoteWidget } from "../src/components/widgets/quoteWidget/quoteWidget.js";
import { quotes } from "../src/components/widgets/quoteWidget/quote.js";

describe("quote navigation", () => {
  let container;
  let previous;
  let next;
  const lines = () =>
    [...container.querySelectorAll(".quote-widget-container--line")].map(
      (line) => line.textContent,
    );

  beforeEach(() => {
    document.body.innerHTML = '<div class="widgets"></div>';
    container = new QuoteWidget().quoteWidgetContainer.container;
    previous = container.querySelector('[aria-label="Previous quote"]');
    next = container.querySelector('[aria-label="Next quote"]');
  });

  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  test("starts with the original quote and its explicit three lines", () => {
    expect(lines()).toEqual(["Keep it simple,", "brilliance lies in", "ease"]);
    expect(
      container.querySelector(".quote-widget-container--text-accent")
        .textContent,
    ).toBe("Keep it simple");
  });

  test("renders the highlighted-only second line without adding undefined", () => {
    next.click();
    expect(lines()).toEqual(["Think less &", "Do more"]);
    expect(
      container.querySelector(".quote-widget-container--text-accent")
        .textContent,
    ).toBe("Do more");
  });

  test("wraps forwards and backwards without disabling either button", () => {
    const expected = [
      {
        lines: ["Keep it simple,", "brilliance lies in", "ease"],
        accent: "Keep it simple",
      },
      { lines: ["Think less &", "Do more"], accent: "Do more" },
      { lines: ["Design every", "detail"], accent: "detail" },
      { lines: ["Improve", "everything!"], accent: "everything" },
    ];
    for (const [button, order] of [
      [next, [1, 2, 3, 0]],
      [previous, [3, 2, 1, 0]],
    ]) {
      for (const index of order) {
        button.click();
        expect(lines()).toEqual(expected[index].lines);
        expect(
          container.querySelector(".quote-widget-container--text-accent")
            .textContent,
        ).toBe(expected[index].accent);
        expect(previous.disabled).toBe(false);
        expect(next.disabled).toBe(false);
      }
    }
  });

  test("keeps the symbol, pattern, text slot, buttons and focus when switching", () => {
    const symbol = container.querySelector(".quote-widget-container--symbol");
    const pattern = container.querySelector(".quote-widget-container--pattern");
    const text = container.querySelector(".quote-widget-container--text");
    next.focus();
    for (let index = 0; index < quotes.length * 3 + 1; index++) next.click();
    expect(lines()[0]).toBe("Think less &");
    expect(container.querySelector(".quote-widget-container--symbol")).toBe(
      symbol,
    );
    expect(container.querySelector(".quote-widget-container--pattern")).toBe(
      pattern,
    );
    expect(container.querySelector(".quote-widget-container--text")).toBe(text);
    expect(container.querySelector('[aria-label="Next quote"]')).toBe(next);
    expect(container.querySelectorAll("button")).toHaveLength(2);
    expect(document.activeElement).toBe(next);
  });

  test("keeps button icons decorative and exposes quote updates accessibly", () => {
    for (const button of [previous, next]) {
      expect(button.type).toBe("button");
      expect(button.getAttribute("aria-label")).toBeTruthy();
      expect(button.querySelector("svg").getAttribute("aria-hidden")).toBe(
        "true",
      );
    }
    const text = container.querySelector(".quote-widget-container--text");
    expect(text.getAttribute("aria-live")).toBe("polite");
    expect(text.getAttribute("aria-atomic")).toBe("true");
    expect(
      container
        .querySelector(".quote-widget-container--symbol")
        .getAttribute("aria-hidden"),
    ).toBe("true");
  });

  test("starts a fresh widget at the first quote without accessing storage", () => {
    const get = jest.spyOn(window.Storage.prototype, "getItem");
    const set = jest.spyOn(window.Storage.prototype, "setItem");
    const remove = jest.spyOn(window.Storage.prototype, "removeItem");
    next.click();
    const fresh = new QuoteWidget().quoteWidgetContainer.container;
    expect(
      fresh.querySelector(".quote-widget-container--line").textContent,
    ).toBe("Keep it simple,");
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  test("uses opposite directions when another quote is added to the catalog", () => {
    const originalLength = quotes.length;
    try {
      quotes.push({ lines: [{ text: "Third quote" }] });
      previous.click();
      expect(lines()).toEqual(["Third quote"]);
      next.click();
      expect(lines()[0]).toBe("Keep it simple,");
      next.click();
      expect(lines()[0]).toBe("Think less &");
    } finally {
      quotes.length = originalLength;
    }
  });
});
