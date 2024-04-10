import { getCurrentDate } from "./dateUtils.js";

export function renderDateContainer() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentDate = getCurrentDate();
  const monthIndex = currentDate.getMonth();
  const dayOfMonth = currentDate.getDate();

  const fullMonthName = months[monthIndex];

  const containerContent = `<div class="flex flex-col h-100 align-center justify-center"><p class="calendar--month">${fullMonthName}</p><p class="calendar--day">${dayOfMonth}</p></div>`;

  return containerContent;
}
