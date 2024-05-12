import { getCurrentDate } from "../../../utils/dateUtils.js";

class DateWidgetRenderer {
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

    container.innerHTML = containerContent;

    return container;
  }
}

export { DateWidgetRenderer };
