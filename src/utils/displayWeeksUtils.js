import {
  getCurrentDate,
  getWeeksInYear,
  getRemainingWeeksOfYear,
  getWeekNumber,
} from "./dateUtils.js";
import { createGrid, displayDaysLeft } from "./widgetWeeksRender.js";

export function renderWidgetContent() {
  const currentDate = getCurrentDate();
  const currentYear = currentDate.getFullYear();
  const weeksInYear = getWeeksInYear(currentYear);
  const currentWeek = getWeekNumber(currentDate);

  const widgetContentContainer = document.createElement("div");
  widgetContentContainer.classList.add(
    "flex",
    "flex-col",
    "justify-between",
    "h-100",
  );

  const gridContainer = createGrid(weeksInYear, currentWeek);
  widgetContentContainer.appendChild(gridContainer);

  const daysLeft = Math.ceil(
    (new Date(currentDate.getFullYear(), 11, 31) - currentDate) /
      (1000 * 60 * 60 * 24),
  );

  const remainingWeeks = getRemainingWeeksOfYear(weeksInYear, currentWeek);

  displayDaysLeft(
    widgetContentContainer,
    daysLeft,
    remainingWeeks,
    currentYear,
  );

  return widgetContentContainer;
}
