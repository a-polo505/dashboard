import { getClockAngles } from "./clockGeometry.js";
import { createClockBackground } from "./clockBackground.js";
import { createClockHands } from "./clockArtwork.js";

let nextClockId = 0;

export class ClockWidgetRenderer {
  render() {
    const prefix = `dashboard-clock-${++nextClockId}`;
    this.container = document.createElement("div");
    this.container.className = "clock";
    this.container.setAttribute("role", "img");
    this.container.innerHTML =
      createClockBackground(prefix) + createClockHands(prefix);
    this.hands = Object.fromEntries(
      ["second", "hour", "minute"].map((name) => [
        name,
        this.container.querySelector(`.clock__${name}`),
      ]),
    );
    this.lastLabel = null;
    return this.container;
  }

  updateTime(date) {
    for (const [name, angle] of Object.entries(getClockAngles(date))) {
      this.hands[name].setAttribute("transform", `rotate(${angle})`);
    }
    const label = [date.getHours(), date.getMinutes(), date.getSeconds()]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
    if (label !== this.lastLabel) {
      this.container.setAttribute("aria-label", `Local time: ${label}`);
      this.lastLabel = label;
    }
  }
}
