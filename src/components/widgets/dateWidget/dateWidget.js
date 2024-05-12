import { WidgetContainer } from "../widget/WidgetContainer.js";
import { DateWidgetRenderer } from "./dateWidgetRender.js";

class DateWidget {
  constructor() {
    this.dateWidgetRenderer = new DateWidgetRenderer();
    this.dateWidgetContainer = new WidgetContainer(
      this.dateWidgetRenderer,
      "date-widget-container",
    );

    this.dateWidgetContainer.addToDOM("col-1");
    this.dateWidgetContainer.renderWidgetContent();
  }
}

export { DateWidget };
