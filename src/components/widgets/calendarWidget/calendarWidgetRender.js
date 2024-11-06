import {
  getCurrentDate,
  getDaysInCurrentMonth,
} from "../../../utils/dateUtils.js";

class CalendarWidgetRenderer {
  constructor() {
    this.currentDate = getCurrentDate();
    this.daysInMonth = getDaysInCurrentMonth();
  }

  render() {
    const container = this.createContainer();
    container.appendChild(this.createHeader());
    container.appendChild(this.createCalendarGrid());

    return container;
  }

  createContainer() {
    const container = document.createElement("div");
    container.classList.add(
      "calendar-container",
      "flex",
      "flex-col",
      "align-center",
    );
    return container;
  }

  createHeader() {
    const header = document.createElement("div");
    header.classList.add("calendar-header", "flex", "flex-col", "gap-0");

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.toLocaleString("en-US", { month: "long" });

    const yearLabel = document.createElement("p");
    yearLabel.classList.add("calendar-year");
    yearLabel.textContent = `${year}`;

    const monthLabel = document.createElement("p");
    monthLabel.classList.add("calendar-month");
    monthLabel.textContent = `${month}`;

    header.appendChild(yearLabel);
    header.appendChild(monthLabel);
    return header;
  }

  createCalendarGrid() {
    const grid = document.createElement("div");
    grid.classList.add("calendar-grid");

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
    weekDays.forEach((day) => {
      const dayElement = document.createElement("span");
      dayElement.classList.add("calendar-weekday");
      dayElement.textContent = day;
      grid.appendChild(dayElement);
    });

    const firstDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1,
    ).getDay();
    const offset = (firstDay + 6) % 7;

    for (let i = 0; i < offset; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("calendar-day-empty");
      grid.appendChild(emptyCell);
    }

    this.daysInMonth.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.classList.add("calendar-day");

      const date = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day,
      );
      if (date.getDay() === 0) {
        dayElement.classList.add("calendar-day-sunday");
      }

      if (day === this.currentDate.getDate()) {
        dayElement.classList.add("calendar-day-today");
      }
      dayElement.textContent = day;
      grid.appendChild(dayElement);
    });

    return grid;
  }
}

export { CalendarWidgetRenderer };
