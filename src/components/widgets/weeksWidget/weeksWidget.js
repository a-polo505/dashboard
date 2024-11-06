import { WidgetContainer } from "../widget/WidgetContainer.js";
import { WeeksWidgetRenderer } from "./weeksWidgetRender.js";

class WeeksWidget {
  constructor() {
    this.weeksWidgetRenderer = new WeeksWidgetRenderer();
    this.weeksWidgetContainer = new WidgetContainer(
      this.weeksWidgetRenderer,
      "weeks-widget-container",
    );

    this.weeksWidgetContainer.addToDOM("widgets");
    this.weeksWidgetContainer.renderWidgetContent();
  }
}

export { WeeksWidget };
