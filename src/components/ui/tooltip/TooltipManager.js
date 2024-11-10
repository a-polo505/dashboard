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

    this.tooltipElement.style.left = `${x}px`;
    this.tooltipElement.style.top = `${y}px`;

    setTimeout(() => {
      if (this.tooltipElement) {
        this.tooltipElement.classList.add("visible");
      }
    }, 10);

    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (tooltipRect.right > viewportWidth) {
      this.tooltipElement.style.left = `${viewportWidth - tooltipRect.width - 10}px`;
    }
    if (tooltipRect.bottom > viewportHeight) {
      this.tooltipElement.style.top = `${viewportHeight - tooltipRect.height - 10}px`;
    }

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

  handleMouseOver(element, text, additionalClass = null) {
    element.removeEventListener("mouseover", this._mouseoverHandler);

    this._mouseoverHandler = (event) => {
      console.log("Mouse over event triggered");
      this.createTooltip(text, event.clientX, event.clientY, additionalClass);
    };

    element.addEventListener("mouseover", this._mouseoverHandler);
  }

  handleMouseLeave(element) {
    element.removeEventListener("mouseleave", this._mouseleaveHandler);

    this._mouseleaveHandler = () => {
      this.removeTooltip();
    };

    element.addEventListener("mouseleave", this._mouseleaveHandler);
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
