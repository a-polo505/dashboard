/** @jest-environment jsdom */

import { WidgetContainer } from "../src/components/widgets/widget/WidgetContainer.js";

describe("widget content replacement", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="widgets"></div>';
  });

  test("renders fresh data without duplicating content or replacing the mounted container", () => {
    const action = jest.fn();
    const renderer = {
      render: jest.fn((data) => {
        const button = document.createElement("button");
        button.textContent = data.label;
        button.addEventListener("click", () => action(data.label));
        return button;
      }),
    };
    const widget = new WidgetContainer(renderer, "example-widget");
    widget.addToDOM();
    const container = widget.container;
    container.dataset.state = "retained";
    const containerClick = jest.fn();
    container.addEventListener("click", containerClick);

    widget.renderWidgetContent({ label: "Initial" });
    const firstContent = container.firstElementChild;
    firstContent.click();
    widget.renderWidgetContent({ label: "Updated" });
    const currentContent = container.firstElementChild;
    currentContent.click();

    expect(document.querySelector(".widgets").firstElementChild).toBe(
      container,
    );
    expect(widget.container).toBe(container);
    expect(container.classList.contains("example-widget")).toBe(true);
    expect(container.classList.contains("Container--small")).toBe(true);
    expect(container.dataset.state).toBe("retained");
    expect(container.children).toHaveLength(1);
    expect(currentContent).not.toBe(firstContent);
    expect(firstContent.isConnected).toBe(false);
    expect(currentContent.textContent).toBe("Updated");
    expect(action.mock.calls).toEqual([["Initial"], ["Updated"]]);
    expect(containerClick).toHaveBeenCalledTimes(2);
  });

  test("retains the displayed content if the next render throws", () => {
    const content = document.createElement("p");
    content.textContent = "Last good content";
    const renderer = { render: jest.fn().mockReturnValueOnce(content) };
    const widget = new WidgetContainer(renderer, "example-widget");
    widget.addToDOM();
    widget.renderWidgetContent();
    renderer.render.mockImplementationOnce(() => {
      throw new Error("Synthetic render failure");
    });

    expect(() => widget.renderWidgetContent()).toThrow(
      "Synthetic render failure",
    );
    expect(widget.container.children).toHaveLength(1);
    expect(widget.container.firstElementChild).toBe(content);
    expect(content.isConnected).toBe(true);
    expect(content.textContent).toBe("Last good content");
  });
});
