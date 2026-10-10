class TooltipManager {
  constructor() {
    this.tooltipElement = null;
    this.isTooltipVisible = false;
    this.activeElement = null;
    this.visibilityTimeout = null;
    this.interactions = new Map();
    this.globalListenersAttached = false;
    this.isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.onScroll = () => this.removeTooltip();
    this.onOutsideClick = (event) => {
      if (
        this.isTooltipVisible &&
        this.activeElement &&
        !this.activeElement.contains(event.target)
      ) {
        this.removeTooltip();
      }
    };
  }

  createTooltip(text, x, y, additionalClass = null) {
    if (this.tooltipElement) {
      this.updateTooltipPosition(x, y);
      return;
    }

    const content = typeof text === "function" ? text() : text;
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.innerHTML = content;
    this.tooltipElement.classList.add("tooltip");
    if (additionalClass) {
      this.tooltipElement.classList.add(additionalClass);
    }
    document.body.appendChild(this.tooltipElement);
    this.updateTooltipPosition(x, y);

    this.visibilityTimeout = setTimeout(() => {
      this.visibilityTimeout = null;
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
    if (this.visibilityTimeout !== null) {
      clearTimeout(this.visibilityTimeout);
      this.visibilityTimeout = null;
    }
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
    this.isTooltipVisible = false;
    this.activeElement = null;
  }

  handleDesktopEvents(element, text, additionalClass) {
    const onMouseover = (event) => {
      if (this.activeElement !== element) this.removeTooltip();
      this.activeElement = element;
      this.createTooltip(text, event.clientX, event.clientY, additionalClass);
    };
    const onMouseleave = () => {
      if (this.activeElement === element) this.removeTooltip();
    };
    element.addEventListener("mouseover", onMouseover);
    element.addEventListener("mouseleave", onMouseleave);
    return () => {
      element.removeEventListener("mouseover", onMouseover);
      element.removeEventListener("mouseleave", onMouseleave);
    };
  }

  handleTouchEvents(element, text, additionalClass) {
    const onClick = (event) => {
      if (this.isTooltipVisible) {
        this.removeTooltip();
      } else {
        this.activeElement = element;
        const rect = element.getBoundingClientRect();
        this.createTooltip(
          text,
          rect.left + rect.width / 2,
          rect.top - 30,
          additionalClass,
        );
      }
      event.stopPropagation();
    };
    element.addEventListener("click", onClick);
    return () => element.removeEventListener("click", onClick);
  }

  handleInteraction(element, text, additionalClass = null) {
    const previousCleanup = this.interactions.get(element);
    if (previousCleanup) {
      previousCleanup();
      if (this.activeElement === element) this.removeTooltip();
    }

    const cleanup = this.isTouchDevice
      ? this.handleTouchEvents(element, text, additionalClass)
      : this.handleDesktopEvents(element, text, additionalClass);
    this.interactions.set(element, cleanup);

    if (!this.globalListenersAttached) {
      window.addEventListener("scroll", this.onScroll);
      if (this.isTouchDevice) {
        document.addEventListener("click", this.onOutsideClick);
      }
      this.globalListenersAttached = true;
    }
  }

  clearInteractions() {
    this.removeTooltip();
    for (const cleanup of this.interactions.values()) cleanup();
    this.interactions.clear();
    if (this.globalListenersAttached) {
      window.removeEventListener("scroll", this.onScroll);
      if (this.isTouchDevice) {
        document.removeEventListener("click", this.onOutsideClick);
      }
      this.globalListenersAttached = false;
    }
  }
}

export { TooltipManager };
