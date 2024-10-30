class PulseEffect {
  constructor(element) {
    this.element = element;
    this.element.addEventListener("click", (event) => this.createPulse(event));
  }

  createPulse(event) {
    const pulse = document.createElement("div");
    pulse.classList.add("pulse");

    const rect = this.element.getBoundingClientRect();
    pulse.style.left = `${event.clientX - rect.left}px`;
    pulse.style.top = `${event.clientY - rect.top}px`;

    this.element.appendChild(pulse);
    pulse.addEventListener("animationend", () => {
      pulse.remove();
    });
  }
}

export { PulseEffect };
