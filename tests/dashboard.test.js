/** @jest-environment jsdom */

import { Dashboard } from "../src/utils/dashboard.js";

test("rejects duplicate widget IDs without registering or changing the second container", () => {
  const dashboard = new Dashboard();
  const first = document.createElement("div");
  const second = document.createElement("div");
  dashboard.addWidget({ id: "date", name: "Date", container: first });

  expect(() =>
    dashboard.addWidget({
      id: "date",
      name: "Another date",
      container: second,
    }),
  ).toThrow("Widget already registered: date");

  expect(dashboard.widgets).toEqual([
    { id: "date", name: "Date", container: first },
  ]);
  expect(first.dataset.widgetId).toBe("date");
  expect(second.hasAttribute("data-widget-id")).toBe(false);
});
