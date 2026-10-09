import { BaseButton } from "../../ui/button/BaseButton.js";
import { ButtonStyle } from "../../ui/button/ButtonStyle.js";
import { diffDays } from "../../../utils/dateUtils.js";

function parseSelectedDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);

  // Reject normalized dates such as February 30 and preserve local calendar days.
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

class DateCountdownRenderer {
  constructor() {
    this.selectedDate = null;
    this.button = new BaseButton(
      "Choose Date",
      () => this.onClick(),
      ButtonStyle.default(),
    );
  }

  render() {
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "h-100",
      "align-center",
      "wraper",
    );

    const containerContent = `
    <div>
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#74b1ff" class="bi bi-calendar-heart-fill" viewBox="0 0 16 16">
    <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M8 7.993c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/>
    </svg></div>
    <div class="flex-col justify-center text-center">
        <div id="selected-date">Choose your special day to count down! 🥳</div>
        <p id="selected-text" class="days-label"></p>
    </div>
    `;

    container.innerHTML = containerContent;
    const buttonSelectDay = this.button.render();
    buttonSelectDay.classList.add("button-select-day");

    container.appendChild(buttonSelectDay);
    document.body.appendChild(container);

    this.checkStoredDate();

    return container;
  }

  onClick() {
    this.showDatePicker();
  }

  showDatePicker() {
    const selectedDate = this.refreshSelectedDate();
    flatpickr(".button-select-day", {
      clickOpens: true,
      dateFormat: "Y-m-d",
      minDate: "today",
      disableMobile: true,
      firstDayOfWeek: 1,
      defaultDate: selectedDate,
      onChange: (selectedDates, dateStr, instance) => {
        this.selectedDate = dateStr;
        if (this.refreshSelectedDate()) {
          try {
            localStorage.setItem("selectedDate", dateStr);
          } catch {
            // Keep the selected date usable in memory if storage is unavailable.
          }
        }

        instance.close();
      },
      onReady: (selectedDates, dateStr, instance) => {
        instance.open();
      },
    });
  }

  checkStoredDate() {
    try {
      this.selectedDate = localStorage.getItem("selectedDate");
    } catch {
      // A missing storage backend must not interrupt widget initialization.
    }
    this.refreshSelectedDate();
  }

  refreshSelectedDate() {
    const selectedDate = parseSelectedDate(this.selectedDate);
    const diff = selectedDate ? diffDays(selectedDate) : 0;
    if (Number.isFinite(diff) && diff > 0) {
      this.updateDisplay(diff);
      return selectedDate;
    }

    if (this.selectedDate !== null) {
      try {
        localStorage.removeItem("selectedDate");
      } catch {
        // Invalid cached dates can still be discarded from the active widget.
      }
    }
    this.selectedDate = null;
    this.resetDisplay();
    return null;
  }

  updateDisplay(diffDays) {
    if (!Number.isFinite(diffDays) || diffDays <= 0) {
      this.resetDisplay();
    } else {
      document.getElementById("selected-date").innerHTML =
        `<p class="days-left">${diffDays}</p>`;
      document.getElementById("selected-text").textContent = "Days Left";
    }
  }

  resetDisplay() {
    document.getElementById("selected-date").innerHTML =
      "Choose your special day to count down! 🥳";
    document.getElementById("selected-text").textContent = "";
  }
}

export { DateCountdownRenderer };
