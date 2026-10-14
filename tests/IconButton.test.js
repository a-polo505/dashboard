/** @jest-environment jsdom */

import { IconButton } from "../src/components/ui/button/IconButton.js";

describe("IconButton", () => {
  let icon;
  let onClick;

  function create(options = {}) {
    return new IconButton({
      id: "actionButton",
      label: "Save",
      icon,
      onClick,
      ...options,
    });
  }

  beforeEach(() => {
    icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("width", "12");
    icon.setAttribute("height", "12");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M1 8L6 13L15 3");
    path.setAttribute("fill", "currentColor");
    icon.append(path);
    onClick = jest.fn();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  test("renders a native button with a visible label and shared primary styling", () => {
    const button = create({ classNames: ["grid-editor__button"] }).render();

    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");
    expect(button.id).toBe("actionButton");
    expect(button.textContent).toBe("Save");
    expect([...button.classList]).toEqual(
      expect.arrayContaining([
        "primary-btn",
        "icon-button",
        "grid-editor__button",
      ]),
    );
    expect(button.disabled).toBe(false);
  });

  test("renders the provided geometry at 16x16 without modifying the original icon", () => {
    const button = create().render();
    const svg = button.querySelector("svg");

    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.getAttribute("height")).toBe("16");
    expect(svg.getAttribute("viewBox")).toBe("0 0 16 16");
    expect(svg.querySelector("path").getAttribute("d")).toBe("M1 8L6 13L15 3");
    expect(svg.querySelector("path").getAttribute("fill")).toBe("currentColor");
    expect(icon.getAttribute("width")).toBe("12");
    expect(icon.parentElement).toBeNull();
  });

  test("keeps the icon decorative so the visible label provides the accessible name", () => {
    const button = create().render();
    const svg = button.querySelector("svg");

    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.querySelector("title")).toBeNull();
    expect(button.hasAttribute("aria-hidden")).toBe(false);
    expect(button.hasAttribute("tabindex")).toBe(false);
    expect(button.hasAttribute("aria-label")).toBe(false);
    expect(button.querySelector("span").textContent).toBe("Save");
  });

  test("handles clicks from the button, label and icon through the native button", () => {
    const button = create().render();
    const received = [];
    onClick.mockImplementation((event) => received.push(event.currentTarget));
    button.click();
    button.querySelector("span").click();
    button
      .querySelector("path")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(onClick).toHaveBeenCalledTimes(3);
    expect(received).toEqual([button, button, button]);
  });

  test("disabled buttons ignore native and dispatched clicks, then work when enabled", () => {
    const button = create({ disabled: true }).render();
    expect(button.disabled).toBe(true);
    button.click();
    button
      .querySelector("span")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();

    button.disabled = false;
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    button.disabled = true;
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("repeated render returns the same button without duplicating its icon or listener", () => {
    const component = create();
    const button = component.render();
    expect(component.render()).toBe(button);
    expect(button.querySelectorAll("svg")).toHaveLength(1);
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("two buttons can reuse the provided icon without moving it out of the first", () => {
    const first = create().render();
    const second = create({ id: "secondButton" }).render();
    expect(first.querySelectorAll("svg")).toHaveLength(1);
    expect(second.querySelectorAll("svg")).toHaveLength(1);
    expect(first.querySelector("svg")).not.toBe(second.querySelector("svg"));
  });

  test("treats label text as text rather than HTML", () => {
    const button = create({ label: "<strong>Save</strong>" }).render();
    expect(button.textContent).toBe("<strong>Save</strong>");
    expect(button.querySelector("strong")).toBeNull();
  });

  test("does not submit a parent form", () => {
    const form = document.createElement("form");
    const submit = jest.fn((event) => event.preventDefault());
    form.addEventListener("submit", submit);
    const button = create().render();
    form.append(button);
    document.body.append(form);
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
  });
});
