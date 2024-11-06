import { WidgetContainer } from "../widget/WidgetContainer.js";
import { CalendarWidgetRenderer } from "./calendarWidgetRender.js";

class CalendarWidget {
  constructor() {
    this.calendarWidgetRenderer = new CalendarWidgetRenderer();
    this.calendarWidgetContainer = new WidgetContainer(
      this.calendarWidgetRenderer,
      "calendar-widget-container",
    );

    this.calendarWidgetContainer.addToDOM("widgets");
    this.calendarWidgetContainer.renderWidgetContent();
  }
}

export { CalendarWidget };
