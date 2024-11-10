class TooltipManager {
  constructor() {
    this.tooltipElement = null;
    this.isTooltipVisible = false;
  }

  createTooltip(text, x, y, additionalClass = null) {
    if (this.tooltipElement) {
      this.updateTooltipPosition(x, y);
      return;
    }

    this.tooltipElement = document.createElement("div");
    this.tooltipElement.innerHTML = text;
    this.tooltipElement.classList.add("tooltip");
    if (additionalClass) {
      this.tooltipElement.classList.add(additionalClass);
    }
    document.body.appendChild(this.tooltipElement);
    this.updateTooltipPosition(x, y);

    setTimeout(() => {
      if (this.tooltipElement) {
        this.tooltipElement.classList.add("visible");
      }
    }, 10);

    this.isTooltipVisible = true;
  }

  updateTooltipPosition(x, y) {
    if (!this.tooltipElement) return;

    this.tooltipElement.style.left = `${x}px`;
    this.tooltipElement.style.top = `${y}px`;

    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (tooltipRect.right > viewportWidth) {
      this.tooltipElement.style.left = `${viewportWidth - tooltipRect.width - 10}px`;
    }
    if (tooltipRect.bottom > viewportHeight) {
      this.tooltipElement.style.top = `${viewportHeight - tooltipRect.height - 10}px`;
    }
  }

  removeTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
      this.isTooltipVisible = false;
    }
  }

  handleDesktopEvents(element, text, additionalClass) {
    element.addEventListener("mouseover", (event) => {
      this.createTooltip(text, event.clientX, event.clientY, additionalClass);
    });
    element.addEventListener("mouseleave", () => this.removeTooltip());
  }

  handleTouchEvents(element, text, additionalClass) {
    element.addEventListener("click", (event) => {
      if (this.isTooltipVisible) {
        this.removeTooltip();
      } else {
        const rect = element.getBoundingClientRect();
        this.createTooltip(
          text,
          rect.left + rect.width / 2,
          rect.top - 30,
          additionalClass,
        );
      }
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      if (this.isTooltipVisible && !element.contains(event.target)) {
        this.removeTooltip();
      }
    });
  }

  handleInteraction(element, text, additionalClass = null) {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      this.handleTouchEvents(element, text, additionalClass);
    } else {
      this.handleDesktopEvents(element, text, additionalClass);
    }
    window.addEventListener("scroll", () => this.removeTooltip());
  }
}

export { TooltipManager };
