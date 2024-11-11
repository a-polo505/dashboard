import { getCurrentDate } from "../../../utils/dateUtils.js";
import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";

class CoffeeWidgetRenderer {
  constructor() {
    this.maxCups = 6;
    this.progressKey = "coffeeCupsProgress";
    this.dateKey = "coffeeCupsDate";
    this.cups = [];
    this.container = null;
    this.tooltipManager = new TooltipManager();
  }

  render() {
    this.container = document.createElement("div");
    this.container.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "h-100",
      "wrapper",
    );
    this.container.innerHTML = `
      <div class="flex flex-col align-baseline">
        <p class="month-day-label">${this.getFormattedDate()}</p>
        <p class="widget-title">Coffee Cups</p>
      </div>
      <div class="coffee-cups-container"></div>
      <div class="flex align-center justify-center max-cups-text-container"></div>
    `;

    this.renderCups();
    this.updateMaxCupsText();

    return this.container;
  }

  renderCups() {
    const cupsContainer = this.container.querySelector(
      ".coffee-cups-container",
    );
    cupsContainer.innerHTML = "";
    this.loadProgress();

    for (let i = 0; i < this.maxCups; i++) {
      const cupIcon = document.createElement("div");
      cupIcon.classList.add("coffee-cup");

      cupIcon.innerHTML = this.cups[i]
        ? this.renderCoffeeIcon()
        : this.renderEmptyCoffeeIcon();
      cupIcon.addEventListener("click", () => this.toggleCup(i));
      cupsContainer.appendChild(cupIcon);
    }
  }

  toggleCup(index) {
    if (this.cups[index]) {
      for (let i = index; i < this.maxCups; i++) {
        this.cups[i] = false;
      }
    } else {
      for (let i = 0; i <= index; i++) {
        this.cups[i] = true;
      }
    }

    this.saveProgress();
    this.renderCups();
    this.updateMaxCupsText();

    const cupIcon = this.container.querySelector(
      `.coffee-cups-container .coffee-cup:nth-child(${index + 1})`,
    );
    cupIcon.classList.add("bounce");

    cupIcon.addEventListener(
      "animationend",
      () => {
        cupIcon.classList.remove("bounce");
      },
      { once: true },
    );
  }

  renderCoffeeIcon() {
    return `
    <svg class="coffee-icon" viewBox="0 0 27 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.989 16.976c-1.29-.066-2.752-.142-4.318-.911a8.078 8.078 0 0 1-1.806-1.22l-4.081 11.33a2.076 2.076 0 0 0 1.012 2.619s1.496.834 2.009 1.086c.551.27 2.244 1.003 2.244 1.003a2.068 2.068 0 0 0 2.69-.8l7.284-11.575c-.431-.433-1.51-.933-1.51-.933-1.02-.502-2.375-.54-3.525-.599Z" fill="#AB604B"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="m26.574 15.48.241-.904c.217-.811 0-1.841-.627-2.481-.227-.232-.22-.393-2.465-1.084l-.233-.066a46.903 46.903 0 0 1-2.055-.752 50.36 50.36 0 0 1-3.981-1.76 50.915 50.915 0 0 1-5.617-3.226c.137.09-.099-.067-.146-.1a36.452 36.452 0 0 1-.334-.228c-.371-.257-.734-.528-1.103-.79-.445-.318-.928-.505-1.484-.48-.456.02-.896.18-1.26.456-.382.299-.647.698-.939 1.077-.29.38-.645.767-.807 1.224-.35.985-.073 2.062.78 2.69a54.484 54.484 0 0 0 13.778 7.346.664.664 0 0 1 .434.703.67.67 0 0 1-.097.279l-.512.819-3.103 4.964c-1.085 1.738-2.171 3.475-3.258 5.212l-.919 1.466c-.3.483-.564 1.002-.906 1.456-.539.713-1.309.936-2.173.731a11.32 11.32 0 0 1-2.293-.811c-.81-.393-1.602-.826-2.413-1.22-.866-.419-1.884-1.018-2.235-1.99-.307-.854.047-1.78.343-2.584.392-1.067.785-2.132 1.179-3.198l2.183-5.925 1.413-3.834.008-.023.062-.167c.168-.457.07-1.034-.425-1.25-.424-.186-1.069-.064-1.25.428L5.313 14.3l-2.167 5.88c-.615 1.67-1.23 3.34-1.847 5.01-.117.32-.237.64-.354.962-.635 1.753.193 3.272 1.639 4.296.844.599 1.769 1.09 2.692 1.563 1.183.605 2.366 1.243 3.646 1.603 1.896.535 3.772.012 4.845-1.701l.927-1.485c1.024-1.638 2.048-3.275 3.07-4.913l3.345-5.35 1.533-2.453a.668.668 0 0 1 .74-.29c.546.147 1.102.215 1.642.01.86-.328 1.359-1.06 1.55-1.951ZM7.46 7.248c.005-.001.01.02.012.046-.01-.027-.015-.046-.012-.046Zm.076.211h-.002a.055.055 0 0 1 .003.007c-.001-.002-.002-.005-.001-.007Zm15.886 8.02c.286.09.594.144.856.062a.75.75 0 0 0 .429-.348c.225-.377.426-.856.393-1.304-.046-.656-.673-.758-1.208-.911-.6-.172-1.197-.357-1.79-.555a46.055 46.055 0 0 1-9.312-4.36 39.632 39.632 0 0 1-2.016-1.316c-.548-.38-1.118-.975-1.75-1.198-.406-.142-.741.227-.965.518-.243.318-.665.84-.537 1.265.068.225.276.375.47.508 1.988 1.352 4.005 2.64 6.127 3.775 2.967 1.58 6.103 2.842 9.303 3.864Z" fill="#D9D9D9"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.46 7.247c.006-.001.01.02.013.046-.01-.027-.015-.046-.012-.046Zm.075.21.002.001v.007a.064.064 0 0 0-.003-.008Zm.012-.533c.022-.03.057-.075.05-.075-.015 0-.037.04-.058.086l.008-.01Z" fill="#D9D9D9"/><path d="m12.697 3.565.13-.123a5 5 0 0 1 5.635-.85l2.186 1.074a5 5 0 0 1 2.77 4.98l-.017.177" stroke="#D9D9D9" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
    `;
  }

  renderEmptyCoffeeIcon() {
    return `
  <svg class="coffee-icon" fill="none" viewBox="0 0 27 34" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="m26.574 14.98.241-.904c.217-.811 0-1.841-.627-2.481-.227-.232-.22-.393-2.465-1.084l-.233-.066a47.08 47.08 0 0 1-2.055-.751 50.378 50.378 0 0 1-3.981-1.761 50.915 50.915 0 0 1-5.617-3.226c.137.09-.099-.067-.146-.1a36.452 36.452 0 0 1-.334-.228c-.371-.257-.734-.528-1.103-.79-.445-.318-.928-.505-1.484-.48-.456.02-.896.18-1.26.456-.382.299-.647.698-.939 1.077-.29.38-.645.767-.807 1.224-.35.985-.073 2.062.78 2.69a54.484 54.484 0 0 0 13.778 7.346.664.664 0 0 1 .434.703.67.67 0 0 1-.097.279l-.512.819-3.103 4.964c-1.085 1.738-2.171 3.475-3.258 5.212l-.919 1.466c-.3.483-.564 1.002-.906 1.456-.539.713-1.309.936-2.173.731a11.32 11.32 0 0 1-2.293-.811c-.81-.393-1.602-.826-2.413-1.22-.866-.419-1.884-1.018-2.235-1.99-.307-.854.047-1.78.343-2.584.392-1.067.785-2.132 1.179-3.198l2.183-5.925 1.413-3.834.008-.023.062-.167c.168-.457.07-1.034-.425-1.25-.424-.186-1.069-.064-1.25.428L5.313 13.8l-2.167 5.88c-.615 1.67-1.23 3.34-1.847 5.01-.117.32-.237.64-.354.962-.635 1.753.193 3.272 1.639 4.296.844.599 1.769 1.09 2.692 1.563 1.183.605 2.366 1.243 3.646 1.603 1.896.535 3.772.012 4.845-1.701l.927-1.485c1.024-1.638 2.048-3.275 3.07-4.913l3.345-5.35 1.533-2.453a.668.668 0 0 1 .74-.29c.546.147 1.102.215 1.642.01.86-.328 1.359-1.06 1.55-1.951ZM7.46 6.748c.005-.001.01.02.012.046-.01-.027-.015-.046-.012-.046Zm.076.211h-.002a.055.055 0 0 1 .003.007c-.001-.002-.002-.005-.001-.007Zm15.886 8.02c.286.09.594.144.856.062a.75.75 0 0 0 .429-.348c.225-.377.426-.856.393-1.304-.046-.656-.673-.758-1.208-.911-.6-.172-1.197-.357-1.79-.555a46.055 46.055 0 0 1-9.312-4.36 39.632 39.632 0 0 1-2.016-1.316c-.548-.38-1.118-.975-1.75-1.198-.406-.142-.741.227-.965.518-.243.318-.665.84-.537 1.265.068.225.276.375.47.508 1.988 1.352 4.005 2.64 6.127 3.775 2.967 1.58 6.103 2.842 9.303 3.864Z" fill="#614132"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.46 6.747c.006-.001.01.02.013.046-.01-.027-.015-.046-.012-.046Zm.075.21.002.001v.007a.064.064 0 0 0-.003-.008Zm.012-.533c.022-.03.057-.075.05-.075-.015 0-.037.04-.058.086l.008-.01Z" fill="#614132"/><path d="m12.697 3.065.13-.123a5 5 0 0 1 5.635-.85l2.186 1.074a5 5 0 0 1 2.77 4.98l-.017.177" stroke="#614132" stroke-width="2.2" stroke-linecap="round"/>
  </svg>
    `;
  }

  updateMaxCupsText() {
    const textContainer = this.container.querySelector(
      ".max-cups-text-container",
    );

    if (this.isMaxCupsReached()) {
      if (!textContainer.querySelector(".max-cups-text")) {
        const textElement = document.createElement("p");
        textElement.classList.add("max-cups-text");
        textElement.textContent = this.getMaxCupsText();
        textContainer.appendChild(textElement);

        setTimeout(() => textElement.classList.add("visible"), 10);
      }
    } else {
      const textElement = textContainer.querySelector(".max-cups-text");
      if (textElement) {
        textElement.classList.remove("visible");
        textElement.addEventListener(
          "transitionend",
          () => {
            textElement.remove();
          },
          { once: true },
        );
      }
    }
  }

  isMaxCupsReached() {
    return this.cups.every((cup) => cup);
  }

  getMaxCupsText() {
    return "Take it easy, coffee lover!";
  }

  getFormattedDate() {
    const currentDate = new Date();
    const month = currentDate.toLocaleString("en-US", { month: "short" });
    const day = currentDate.getDate();
    return `${month}, ${day}`;
  }

  loadProgress() {
    const savedDate = localStorage.getItem(this.dateKey);
    const currentDate = getCurrentDate().toDateString();

    if (savedDate !== currentDate) {
      this.cups = Array(this.maxCups).fill(false);
      localStorage.setItem(this.dateKey, currentDate);
      localStorage.setItem(this.progressKey, JSON.stringify(this.cups));
    } else {
      this.cups =
        JSON.parse(localStorage.getItem(this.progressKey)) ||
        Array(this.maxCups).fill(false);
    }
  }

  saveProgress() {
    localStorage.setItem(this.progressKey, JSON.stringify(this.cups));
  }
}

export { CoffeeWidgetRenderer };
