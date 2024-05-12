import {
  getCurrentDate,
  getWeeksInYear,
  getRemainingWeeksOfYear,
  getWeekNumber,
} from "../../../utils/dateUtils.js";
import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";

class WeeksWidgetRenderer {
  constructor() {
    this.tooltipManager = new TooltipManager();
  }

  render() {
    const currentDate = getCurrentDate();
    const currentYear = currentDate.getFullYear();
    const weeksInYear = getWeeksInYear(currentYear);
    const currentWeek = getWeekNumber(currentDate);

    const weeksContentContainer = document.createElement("div");
    weeksContentContainer.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "h-100",
    );

    const gridContainer = this.renderGrid(weeksInYear, currentWeek);
    weeksContentContainer.appendChild(gridContainer);

    const daysLeft = Math.ceil(
      (new Date(currentDate.getFullYear(), 11, 31) - currentDate) /
        (1000 * 60 * 60 * 24),
    );
    const remainingWeeks = getRemainingWeeksOfYear(weeksInYear, currentWeek);

    this.displayDaysLeft(
      weeksContentContainer,
      daysLeft,
      remainingWeeks,
      currentYear,
    );

    return weeksContentContainer;
  }

  renderGrid(weeksInYear, currentWeek) {
    const gridContainer = document.createElement("div");
    gridContainer.classList.add("weeks-grid", "flex", "gap-4", "wrap");

    for (let week = 1; week <= weeksInYear; week++) {
      const gridItem = document.createElement("div");
      gridItem.classList.add("grid-item");
      gridItem.dataset.week = week;

      if (week < currentWeek) {
        gridItem.classList.add("past-week");
      } else if (week === currentWeek) {
        gridItem.classList.add("current-week");
      } else {
        gridItem.classList.add("future-week");
      }

      this.tooltipManager.handleMouseOver(gridItem, `Week ${week}`);
      this.tooltipManager.handleMouseLeave(gridItem);

      gridContainer.appendChild(gridItem);
    }
    this.tooltipManager.handleScroll();
    return gridContainer;
  }

  displayDaysLeft(container, daysLeft, remainingWeeks, currentYear) {
    const daysLeftContainer = document.createElement("div");
    daysLeftContainer.classList.add("days-left");

    const weekPlural = remainingWeeks === 1 ? "" : "s";
    const dayPlural = daysLeft === 1 ? "" : "s";

    const daysLeftText = document.createElement("p");
    daysLeftText.classList.add("m-0");
    daysLeftText.innerHTML = `<span class="text-accent">${daysLeft} day${dayPlural}, ${remainingWeeks} week${weekPlural}</span> left until ${currentYear + 1}`;

    daysLeftContainer.appendChild(daysLeftText);
    container.appendChild(daysLeftContainer);
  }
}

export { WeeksWidgetRenderer };
