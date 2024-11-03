import { BaseButton } from "../../ui/button/BaseButton.js";
import { ButtonStyle } from "../../ui/button/ButtonStyle.js";

class MusicWidgetRenderer {
  constructor() {
    this.button = new BaseButton(
      "Listen Now",
      () => this.onClick(),
      ButtonStyle.default(),
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
      "lava-container",
    );

    const containerContent = `
      <div class="flex align-center h-100 flex-col justify-between button-container">
        <div class="flex justify-end w-100 music-icon-box">
          <svg width="20" height="19" viewBox="0 0 20 19" class="music-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.99121 18.7422C14.9746 18.7422 19.0879 14.6289 19.0879 9.6543C19.0879 4.67969 14.9658 0.566406 9.98242 0.566406C5.00781 0.566406 0.90332 4.67969 0.90332 9.6543C0.90332 14.6289 5.0166 18.7422 9.99121 18.7422ZM13.542 10.1729L8.27734 13.2578C7.84668 13.5127 7.3457 13.293 7.3457 12.8535V6.47266C7.3457 6.02441 7.87305 5.82227 8.27734 6.05957L13.542 9.16211C13.9199 9.39062 13.9287 9.94434 13.542 10.1729Z" fill="#A5281A"/>
          </svg>
        </div>
        <p class="text">ROCK TIME</p>
      </div>
      <p class="bubble"></p>
      <p class="bubble"></p>
      <p class="bubble"></p>
      <p class="bubble"></p>
      <p class="bubble"></p>
    `;

    container.innerHTML = containerContent;

    const ytMusicPlaylistButton = this.button.render();
    ytMusicPlaylistButton.classList.add("button");

    const buttonContainer = container.querySelector(".button-container");
    buttonContainer.appendChild(ytMusicPlaylistButton);

    ytMusicPlaylistButton.addEventListener("mouseenter", () =>
      this.addFastBubbles(container),
    );
    ytMusicPlaylistButton.addEventListener("mouseleave", () =>
      this.removeFastBubbles(container),
    );
    return container;
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
    const playlistUrl =
      "https://music.youtube.com/watch?v=DV-acRCuOGU&si=KyDBdkGJhpYHWFvU&t=8";
    window.open(playlistUrl, "_blank");
  }
}

export { MusicWidgetRenderer };
