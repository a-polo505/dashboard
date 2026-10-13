import { getCurrentDate } from "../../../utils/dateUtils.js";
import {
  readCoffeeProgress,
  saveCoffeeProgress,
} from "../../../utils/coffeeProgressStorage.js";
import { FILLED_COFFEE_ICON, EMPTY_COFFEE_ICON } from "./coffeeIcons.js";

class CoffeeWidgetRenderer {
  constructor() {
    this.maxCups = 6;
    this.cups = [];
    this.progressDate = null;
    this.container = null;
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

    this.loadProgress();
    this.renderCups();
    this.updateMaxCupsText();

    return this.container;
  }

  renderCups() {
    const cupsContainer = this.container.querySelector(
      ".coffee-cups-container",
    );
    cupsContainer.innerHTML = "";

    for (let i = 0; i < this.maxCups; i++) {
      const cupIcon = document.createElement("div");
      cupIcon.classList.add("coffee-cup", "coffee-cup-shake");

      cupIcon.innerHTML = this.cups[i] ? FILLED_COFFEE_ICON : EMPTY_COFFEE_ICON;
      cupIcon.addEventListener("click", () => this.toggleCup(i));
      cupsContainer.appendChild(cupIcon);
    }
  }

  toggleCup(index) {
    if (this.progressDate !== getCurrentDate().toDateString()) {
      this.loadProgress();
    }

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

  updateMaxCupsText() {
    const textContainer = this.container.querySelector(
      ".max-cups-text-container",
    );
    let textElement = textContainer.querySelector(".max-cups-text");

    if (this.isMaxCupsReached()) {
      if (!textElement) {
        textElement = document.createElement("p");
        textElement.classList.add("max-cups-text");
        textElement.textContent = this.getMaxCupsText();
        textContainer.appendChild(textElement);

        textElement.addEventListener("transitionend", () => {
          if (!this.isMaxCupsReached()) textElement.remove();
        });

        setTimeout(() => {
          if (this.isMaxCupsReached()) textElement.classList.add("visible");
        }, 10);
      } else {
        textElement.classList.add("visible");
      }
    } else if (textElement) {
      textElement.classList.remove("visible");
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
    const currentDate = getCurrentDate().toDateString();
    this.progressDate = currentDate;
    const progress = readCoffeeProgress(currentDate, this.maxCups);
    this.cups = progress ?? Array(this.maxCups).fill(false);
    if (progress === null) {
      this.saveProgress();
    }
  }

  saveProgress() {
    saveCoffeeProgress(this.cups, this.progressDate);
  }
}

export { CoffeeWidgetRenderer };
