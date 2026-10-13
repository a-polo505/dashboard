import { Widget } from "./Widget.js";

class WidgetContainer extends Widget {
  constructor(
    widgetRenderer,
    widgetClass,
    containerType = "Small",
    contentHTML = "",
  ) {
    super(containerType, contentHTML);
    this.widgetRenderer = widgetRenderer;
    this.container.classList.add(widgetClass);
  }

  renderWidgetContent(...renderArgs) {
    const widgetContent = this.widgetRenderer.render(...renderArgs);
    this.container.replaceChildren(widgetContent);
  }
}

export { WidgetContainer };
