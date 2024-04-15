import { createContainer } from "./components/container.js";
import { fetchDataAndDisplay } from "./utils/fetchUtils.js";
import { renderDateContainer } from "./utils/widgetDateRender.js";
import { renderWeekWidgetContent } from "./utils/displayWeeksUtils.js";

const defaultContainerContent = '<p class="default-text-style">Soon 🛠</p>';

document.addEventListener("DOMContentLoaded", fetchDataAndDisplay);

const widgetWeekContainer = createContainer("Small");
widgetWeekContainer.classList.add("week-widget-container");
document.getElementById("col-2").appendChild(widgetWeekContainer);

const widgetWeekContent = renderWeekWidgetContent();
widgetWeekContainer.appendChild(widgetWeekContent);

const defaultContainer2 = createContainer("Small", defaultContainerContent);
defaultContainer2.classList.add("sky-color");
document.getElementById("col-2").appendChild(defaultContainer2);

const defaultContainer3 = createContainer("Small", defaultContainerContent);
defaultContainer3.classList.add("green-color");
document.getElementById("col-3").appendChild(defaultContainer3);

const calendarContainerContent = renderDateContainer();

const widgetCalendarContainer = createContainer(
  "Small",
  calendarContainerContent,
);
widgetCalendarContainer.classList.add("calendar-widget-container");
document.getElementById("col-1").appendChild(widgetCalendarContainer);

const defaultContainer5 = createContainer("Small", defaultContainerContent);
defaultContainer5.classList.add("blue-color");
document.getElementById("col-3").appendChild(defaultContainer5);
