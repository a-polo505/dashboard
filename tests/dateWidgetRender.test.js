/** @jest-environment jsdom */

import { DateWidgetRenderer } from "../src/components/widgets/dateWidget/dateWidgetRender.js";

describe("date widget display", () => {
  let renderer;

  function hover(element) {
    const event = new window.MouseEvent("pointerover", {
      bubbles: true,
      clientX: 20,
      clientY: 30,
    });
    Object.defineProperty(event, "pointerType", { value: "mouse" });
    element.dispatchEvent(event);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 15, 12));
    document.body.innerHTML = "";
    renderer = new DateWidgetRenderer();
  });

  afterEach(() => {
    renderer.tooltipManager.clearInteractions();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test.each([
    [new Date(2026, 9, 15, 12), "Thu", "Oct", "15"],
    [new Date(2024, 1, 29, 0, 5), "Thu", "Feb", "29"],
    [new Date(2027, 0, 1, 0, 5), "Fri", "Jan", "1"],
  ])(
    "renders short English labels and the local calendar day for %s",
    (date, weekday, month, day) => {
      jest.setSystemTime(date);

      const content = renderer.render();

      expect(content.querySelector(".date--weekday").textContent).toBe(weekday);
      expect(content.querySelector(".date--month").textContent).toBe(month);
      expect(content.querySelector(".date--day").textContent).toBe(day);
    },
  );

  test("keeps the full-date tooltip on the day number only", () => {
    const content = renderer.render();
    document.body.appendChild(content);

    hover(content.querySelector(".date--weekday"));
    hover(content.querySelector(".date--month"));
    expect(document.querySelector(".tooltip")).toBeNull();

    hover(content.querySelector(".date--day"));

    expect(document.querySelector(".tooltip").textContent).toBe(
      "Thursday, October 15, 2026",
    );
  });

  test("replaces the tooltip binding and its date when rendered again", () => {
    const previousContent = renderer.render();
    document.body.appendChild(previousContent);
    const previousDay = previousContent.querySelector(".date--day");
    hover(previousDay);
    jest.setSystemTime(new Date(2026, 9, 16, 12));

    const content = renderer.render();
    previousContent.replaceWith(content);

    expect(document.querySelector(".tooltip")).toBeNull();
    hover(previousDay);
    expect(document.querySelector(".tooltip")).toBeNull();
    hover(content.querySelector(".date--day"));
    expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
    expect(document.querySelector(".tooltip").textContent).toBe(
      "Friday, October 16, 2026",
    );
  });
});
