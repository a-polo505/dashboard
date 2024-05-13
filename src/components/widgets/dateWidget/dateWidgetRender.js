import { getCurrentDate } from "../../../utils/dateUtils.js";
import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";

class DateWidgetRenderer {
  constructor() {
    this.tooltipManager = new TooltipManager();
  }

  render() {
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
    const month = currentDate.toLocaleString("en-US", { month: "long" });
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const day = currentDate.getDate();

    const containerContent = `
        <p class="date--month">${capitalizedMonth}</p>
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

    this.tooltipManager.handleMouseOver(dayElement, `${todaysDateText}`);
    this.tooltipManager.handleMouseLeave(dayElement);
    this.tooltipManager.handleScroll();
    this.tooltipManager.handleTooltipClick();

    return container;
  }
}

export { DateWidgetRenderer };
