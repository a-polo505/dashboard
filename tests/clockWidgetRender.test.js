/** @jest-environment jsdom */

import { ClockWidgetRenderer } from "../src/components/widgets/clockWidget/clockWidgetRender.js";

describe("clock artwork and rendering", () => {
  let renderer;
  let content;

  beforeEach(() => {
    document.body.replaceChildren();
    renderer = new ClockWidgetRenderer();
    content = renderer.render();
    document.body.appendChild(content);
  });

  test("keeps the supplied background geometry and the requested layer order", () => {
    expect(
      [...content.querySelectorAll("svg")].map((svg) => svg.classList.value),
    ).toEqual(["clock__face", "clock__hands"]);
    expect(content.querySelectorAll(".clock__face filter")).toHaveLength(18);
    expect(content.querySelectorAll(".clock__face feTurbulence")).toHaveLength(
      18,
    );
    expect(
      [...content.querySelectorAll("text")].map((node) => node.textContent),
    ).toEqual(["12", "3", "6", "9"]);
    const second = content.querySelector(".clock__second");
    expect(
      [...second.parentElement.children].map((node) => node.classList.value),
    ).toEqual(["clock__second", "clock__hour", "clock__minute", "clock__hub"]);
    expect(second.parentElement.getAttribute("transform")).toBe(
      "translate(87.5 87.5)",
    );
  });

  test("uses resolvable, unique SVG IDs even with multiple clock instances", () => {
    document.body.appendChild(new ClockWidgetRenderer().render());
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const references = [
      ...document.body.innerHTML.matchAll(/url\(#([^)]*)\)/g),
    ];
    expect(references.length).toBeGreaterThan(18);
    for (const [, id] of references)
      expect(document.getElementById(id)).not.toBeNull();
  });

  test("updates hand transforms without rebuilding the face, hands, or SVG definitions", () => {
    const originalNodes = [...content.querySelectorAll("*")];
    renderer.updateTime(new Date(2026, 9, 26, 3, 15, 30));
    expect(
      content.querySelector(".clock__second").getAttribute("transform"),
    ).toBe("rotate(180)");
    expect(
      content.querySelector(".clock__minute").getAttribute("transform"),
    ).toBe("rotate(93)");
    expect(
      content.querySelector(".clock__hour").getAttribute("transform"),
    ).toBe("rotate(97.75)");
    renderer.updateTime(new Date(2026, 9, 26, 3, 15, 30, 500));
    expect(
      content.querySelector(".clock__second").getAttribute("transform"),
    ).toBe("rotate(183)");
    expect([...content.querySelectorAll("*")]).toEqual(originalNodes);
  });

  test("exposes local time without announcing every frame", () => {
    renderer.updateTime(new Date(2026, 9, 26, 13, 2, 3));
    expect(content.getAttribute("role")).toBe("img");
    expect(content.getAttribute("aria-label")).toBe("Local time: 13:02:03");
    const setAttribute = jest.spyOn(content, "setAttribute");
    renderer.updateTime(new Date(2026, 9, 26, 13, 2, 3, 500));
    expect(setAttribute).not.toHaveBeenCalled();
    renderer.updateTime(new Date(2026, 9, 26, 13, 2, 4));
    expect(content.getAttribute("aria-label")).toBe("Local time: 13:02:04");
    expect(content.hasAttribute("aria-live")).toBe(false);
    setAttribute.mockRestore();
  });
});
