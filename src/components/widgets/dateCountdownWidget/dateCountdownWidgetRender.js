import { BaseButton } from "../../ui/button/BaseButton.js";
import { ButtonStyle } from "../../ui/button/ButtonStyle.js";
import { diffDays } from "../../../utils/dateUtils.js";

class DateCountdownRenderer {
  constructor() {
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
    flatpickr(".button-select-day", {
      clickOpens: true,
      dateFormat: "Y-m-d",
      minDate: "today",
      disableMobile: true,
      firstDayOfWeek: 1,
      onChange: (selectedDates, dateStr, instance) => {
        const selectedDate = new Date(dateStr);
        const diff = diffDays(selectedDate);

        localStorage.setItem("selectedDate", dateStr);

        this.updateDisplay(diff);
        instance.close();
      },
      onReady: (selectedDates, dateStr, instance) => {
        instance.open();
      },
    });
  }

  checkStoredDate() {
    const storedDate = localStorage.getItem("selectedDate");
    if (storedDate) {
      const selectedDate = new Date(storedDate);
      const diff = diffDays(selectedDate);
      if (diff <= 0) {
        this.resetDisplay();
      } else {
        this.updateDisplay(diff);
      }
    }
  }

  updateDisplay(diffDays) {
    if (diffDays <= 0) {
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
