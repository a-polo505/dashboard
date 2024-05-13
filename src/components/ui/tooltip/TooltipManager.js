class TooltipManager {
  constructor() {
    this.tooltipElement = null;
    this.isTooltipVisible = false;
  }

  createTooltip(text, x, y) {
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.textContent = text;
    this.tooltipElement.classList.add("tooltip");
    this.tooltipElement.style.left = `${x}px`;
    this.tooltipElement.style.top = `${y}px`;
    document.body.appendChild(this.tooltipElement);
    this.isTooltipVisible = true;
  }

  updateTooltipPosition(x, y) {
    if (this.tooltipElement) {
      this.tooltipElement.style.left = `${x}px`;
      this.tooltipElement.style.top = `${y}px`;
    }
  }

  removeTooltip() {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
      this.isTooltipVisible = false;
    }
  }

  handleTap(element, text) {
    element.addEventListener("click", (event) => {
      if (this.isTooltipVisible) {
        this.removeTooltip();
      } else {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top - 30;
        this.createTooltip(text, x, y);
      }
    });
  }

  handleMouseOver(element, text) {
    element.addEventListener("mouseover", (event) => {
      this.createTooltip(text, event.clientX, event.clientY);
    });
  }

  handleMouseLeave(element) {
    element.addEventListener("mouseleave", () => {
      this.removeTooltip();
    });
  }

  handleScroll() {
    window.addEventListener("scroll", () => {
      if (this.isTooltipVisible) {
        this.removeTooltip();
      }
    });
  }

  handleTooltipClick() {
    if (this.isTooltipVisible) {
      this.removeTooltip();
    }
  }
}

export { TooltipManager };
