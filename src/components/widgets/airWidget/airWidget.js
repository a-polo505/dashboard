import { WidgetContainer } from "../widget/WidgetContainer.js";
import { AirWidgetRenderer } from "./airWidgetRender.js";

class AirWidget {
  constructor() {
    this.airWidgetRenderer = new AirWidgetRenderer();
    this.airWidgetContainer = new WidgetContainer(
      this.airWidgetRenderer,
      "air-widget-container",
    );

    this.airWidgetContainer.addToDOM("col-2");
    this.airWidgetContainer.renderWidgetContent();
  }
}

export { AirWidget };
