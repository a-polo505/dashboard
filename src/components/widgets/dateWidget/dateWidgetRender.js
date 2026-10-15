import { getCurrentDate } from "../../../utils/dateUtils.js";
import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";

class DateWidgetRenderer {
  constructor() {
    this.tooltipManager = new TooltipManager();
  }

  render() {
    this.tooltipManager.clearInteractions();
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-center",
      "h-100",
      "align-center",
      "wraper",
    );

    const currentDate = getCurrentDate();
    const weekday = currentDate.toLocaleString("en-US", { weekday: "short" });
    const month = currentDate.toLocaleString("en-US", { month: "short" });
    const day = currentDate.getDate();

    const containerContent = `
        <div class="date--heading">
          <p class="date--weekday">${weekday}</p>
          <p class="date--month">${month}</p>
        </div>
        <p class="date--day">${day}</p>
    `;

    const todaysDateText = currentDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    container.innerHTML = containerContent;
    const dayElement = container.querySelector(".date--day");

    this.tooltipManager.handleInteraction(
      dayElement,
      "".concat(todaysDateText),
    );

    return container;
  }
}

export { DateWidgetRenderer };
