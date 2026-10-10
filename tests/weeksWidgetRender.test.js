/** @jest-environment jsdom */

import { WeeksWidgetRenderer } from "../src/components/widgets/weeksWidget/weeksWidgetRender.js";

jest.mock("../src/components/ui/tooltip/TooltipManager.js", () => ({
  TooltipManager: jest.fn().mockImplementation(() => ({
    handleInteraction: jest.fn(),
    clearInteractions: jest.fn(),
  })),
}));

describe("weeks widget calendar consistency", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderAt(date) {
    jest.setSystemTime(date);
    const renderer = new WeeksWidgetRenderer();
    document.body.replaceChildren(renderer.render());
    return renderer;
  }

  test.each([
    [new Date(2026, 0, 1, 12), 53, 1, 365],
    [new Date(2026, 0, 4, 12), 53, 1, 362],
    [new Date(2026, 0, 5), 53, 2, 361],
    [new Date(2026, 9, 10, 12), 53, 41, 83],
    [new Date(2026, 11, 31, 12), 53, 53, 1],
    [new Date(2024, 1, 28, 12), 53, 9, 308],
    [new Date(2012, 11, 31, 12), 54, 54, 1],
    [new Date(2028, 11, 31, 12), 53, 53, 1],
  ])(
    "aligns grid, highlighted week, and countdown on %s",
    (date, totalWeeks, week, days) => {
      const renderer = renderAt(date);
      const futureWeeks = totalWeeks - week;

      expect(document.querySelectorAll(".grid-item")).toHaveLength(totalWeeks);
      expect(document.querySelectorAll(".current-week")).toHaveLength(1);
      expect(document.querySelector(".current-week").dataset.week).toBe(
        String(week),
      );
      expect(document.querySelectorAll(".past-week")).toHaveLength(week - 1);
      expect(document.querySelectorAll(".future-week")).toHaveLength(
        futureWeeks,
      );
      expect(document.querySelector(".days-left").textContent).toBe(
        `${days} day${days === 1 ? "" : "s"}, ${futureWeeks} week${futureWeeks === 1 ? "" : "s"} left until ${date.getFullYear() + 1}`,
      );
      expect(renderer.tooltipManager.handleInteraction).toHaveBeenCalledTimes(
        totalWeeks,
      );
    },
  );

  test("does not change the calendar countdown during a DST-affected day", () => {
    renderAt(new Date(2026, 9, 24, 0));
    const midnightText = document.querySelector(".days-left").textContent;

    renderAt(new Date(2026, 9, 24, 12));

    expect(document.querySelector(".days-left").textContent).toBe(midnightText);
    expect(midnightText).toBe("69 days, 10 weeks left until 2027");
  });

  test("switches to the new year's first week after midnight on January 1", () => {
    renderAt(new Date(2026, 11, 31, 23, 59));
    expect(document.querySelector(".current-week").dataset.week).toBe("53");

    renderAt(new Date(2027, 0, 1, 0));

    expect(document.querySelector(".current-week").dataset.week).toBe("1");
    expect(document.querySelectorAll(".past-week")).toHaveLength(0);
    expect(document.querySelector(".days-left").textContent).toBe(
      "365 days, 52 weeks left until 2028",
    );
  });
});
