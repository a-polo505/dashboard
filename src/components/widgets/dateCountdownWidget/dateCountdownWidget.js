import { WidgetContainer } from "../widget/WidgetContainer.js";
import { DateCountdownRenderer } from "./dateCountdownWidgetRender.js";

class DateCountdownWidget {
  constructor() {
    this.dateCountDownRenderer = new DateCountdownRenderer();
    this.dateCountDownContainer = new WidgetContainer(
      this.dateCountDownRenderer,
      "datecount-widget-container",
    );

    this.dateCountDownContainer.addToDOM("col-1");
    this.dateCountDownContainer.renderWidgetContent();
  }
}

export { DateCountdownWidget };
