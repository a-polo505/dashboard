import { WidgetContainer } from "../widget/WidgetContainer.js";
import { TimeWidgetRenderer } from "./timeWidgetRender.js";
import { getRemainingPercentage } from "../../../utils/timeUtils.js";

class TimeWidget {
  constructor() {
    this.timeWidgetRenderer = new TimeWidgetRenderer();

    this.timeWidgetContainer = new WidgetContainer(
      this.timeWidgetRenderer,
      "time-widget-container",
    );

    this.timeWidgetContainer.addToDOM("widgets");

    this.renderWidgetContent();

    setInterval(
      () => {
        this.renderWidgetContent();
      },
      5 * 60 * 1000,
    );
  }

  renderWidgetContent() {
    const remainingPercentage = getRemainingPercentage();
    const widgetContent = this.timeWidgetRenderer.render(remainingPercentage);
    this.timeWidgetContainer.container.innerHTML = "";
    this.timeWidgetContainer.appendContent(widgetContent);
  }
}

export { TimeWidget };
