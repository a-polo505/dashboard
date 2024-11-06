import { BaseButton } from "../../ui/button/BaseButton.js";
import { ButtonStyle } from "../../ui/button/ButtonStyle.js";

class MusicWidgetRenderer {
  constructor(playlistUrl) {
    this.playlistUrl = playlistUrl;
    this.button = this.createButton();
  }

  render() {
    const container = this.createContainer();
    const buttonContainer = this.createButtonContainer();
    const bubbles = this.createBubbles();

    container.appendChild(buttonContainer);
    bubbles.forEach((bubble) => container.appendChild(bubble));

    return container;
  }

  createContainer() {
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-center",
      "h-100",
      "align-center",
      "wraper",
      "lava-container",
    );
    return container;
  }

  createButtonContainer() {
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add(
      "flex",
      "align-center",
      "h-100",
      "flex-col",
      "justify-between",
      "button-container",
    );

    const musicIconBox = this.createMusicIconBox();
    const textElement = this.createTextElement();
    const buttonElement = this.button.render();
    buttonElement.classList.add("button");

    buttonContainer.appendChild(musicIconBox);
    buttonContainer.appendChild(textElement);
    buttonContainer.appendChild(buttonElement);

    buttonElement.addEventListener("mouseenter", () =>
      this.addFastBubbles(buttonContainer.parentElement),
    );
    buttonElement.addEventListener("mouseleave", () =>
      this.removeFastBubbles(buttonContainer.parentElement),
    );

    return buttonContainer;
  }

  createMusicIconBox() {
    const musicIconBox = document.createElement("div");
    musicIconBox.classList.add(
      "flex",
      "justify-end",
      "w-100",
      "music-icon-box",
    );

    const svgIcon = `
      <svg width="20" height="19" viewBox="0 0 20 19" class="music-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.99121 18.7422C14.9746 18.7422 19.0879 14.6289 19.0879 9.6543C19.0879 4.67969 14.9658 0.566406 9.98242 0.566406C5.00781 0.566406 0.90332 4.67969 0.90332 9.6543C0.90332 14.6289 5.0166 18.7422 9.99121 18.7422ZM13.542 10.1729L8.27734 13.2578C7.84668 13.5127 7.3457 13.293 7.3457 12.8535V6.47266C7.3457 6.02441 7.87305 5.82227 8.27734 6.05957L13.542 9.16211C13.9199 9.39062 13.9287 9.94434 13.542 10.1729Z" fill="#A5281A"/>
      </svg>
    `;

    musicIconBox.innerHTML = svgIcon;
    return musicIconBox;
  }

  createTextElement() {
    const textElement = document.createElement("p");
    textElement.classList.add("text");
    textElement.textContent = "ROCK TIME";
    return textElement;
  }

  createBubbles() {
    const bubbles = [];
    for (let i = 0; i < 5; i++) {
      const bubble = document.createElement("p");
      bubble.classList.add("bubble");
      bubbles.push(bubble);
    }
    return bubbles;
  }

  createButton() {
    return new BaseButton(
      "Listen Now",
      () => this.onClick(),
      ButtonStyle.default(),
    );
  }

  addFastBubbles(container) {
    for (let i = 0; i < 3; i++) {
      const bubble = document.createElement("p");
      bubble.classList.add("bubble", "fast-bubble");

      const size = 15 + Math.random() * 20;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;

      bubble.style.left = `${Math.random() * 80}%`;
      bubble.style.animationDelay = `${Math.random() * 1.5}s`;
      bubble.style.animationDuration = "2s";

      container.appendChild(bubble);
    }
  }

  removeFastBubbles(container) {
    const fastBubbles = container.querySelectorAll(".fast-bubble");
    fastBubbles.forEach((bubble) => bubble.remove());
  }

  onClick() {
    window.open(this.playlistUrl, "_blank");
  }
}

export { MusicWidgetRenderer };
