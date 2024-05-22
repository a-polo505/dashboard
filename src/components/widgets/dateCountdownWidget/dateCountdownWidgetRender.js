import flatpickr from "flatpickr";
import { getCurrentDate } from "../../../utils/dateUtils.js";
import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";
import { BaseButton } from "../../ui/button/BaseButton.js";
import { ButtonStyle } from "../../ui/button/ButtonStyle.js";

class DateCountdownRenderer {
  constructor() {
    this.tooltipManager = new TooltipManager();
    this.button = new BaseButton(
        'Select Date',
        this.showDatePicker.bind(this),
        ButtonStyle.default()
      );
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

    const containerContent = `
        <p class="date--month"></p>
        <p class="date--day"></p>
    `;

    container.innerHTML = containerContent;
        // Додаємо кнопку до контейнера
        container.appendChild(this.button.render());

    
    this.tooltipManager.handleScroll();
    this.tooltipManager.handleTooltipClick();

    return container;
  }

  showDatePicker() {
    // Логіка для відображення datepicker та обробки вибору дати
    // Наприклад, використання бібліотеки flatpickr
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'datepicker';

    const container = document.querySelector('.wraper');
    container.appendChild(input);

    flatpickr(input, {
      dateFormat: 'Y-m-d',
      minDate: 'today',
      onChange: (selectedDates, dateStr, instance) => {
        const selectedDate = new Date(dateStr);
        const currentDate = getCurrentDate();
        const diffTime = selectedDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        alert(`Days remaining: ${diffDays}`);
        instance.destroy();  // Прибираємо datepicker після вибору дати
        container.removeChild(input); // Видаляємо input
      },
    });

    input.click(); // Відкриваємо datepicker автоматично
  }
}

export { DateCountdownRenderer };
