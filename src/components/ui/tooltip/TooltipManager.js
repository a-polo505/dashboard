// Coordinate visibility while keeping subscriptions owned by each manager.
let activeManager = null;

class TooltipManager {
  constructor() {
    this.tooltipElement = null;
    this.isTooltipVisible = false;
    this.activeElement = null;
    this.visibilityTimeout = null;
    this.removalTimeout = null;
    this.interactions = new Map();
    this.globalListenersAttached = false;
    this.onScroll = () => this.removeTooltip();
    this.onOutsideClick = (event) => {
      if (
        this.isTooltipVisible &&
        this.activeElement &&
        !this.activeElement.contains(event.target) &&
        !this.tooltipElement.contains(event.target)
      ) {
        this.removeTooltip();
      }
    };
    this.onKeydown = (event) => {
      if (event.key === "Escape") this.removeTooltip();
    };
    this.onTooltipEnter = (event) => {
      if (event.pointerType === "mouse") this.cancelRemoval();
    };
    this.onTooltipLeave = (event) => {
      if (
        event.pointerType === "mouse" &&
        !this.activeElement?.contains(event.relatedTarget)
      ) {
        this.scheduleRemoval();
      }
    };
  }

  createTooltip(text, x, y, additionalClass = null) {
    this.cancelRemoval();
    if (activeManager && activeManager !== this) activeManager.removeTooltip();
    activeManager = this;
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
    this.tooltipElement.addEventListener("pointerenter", this.onTooltipEnter);
    this.tooltipElement.addEventListener("pointerleave", this.onTooltipLeave);
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
    this.cancelRemoval();
    if (this.visibilityTimeout !== null) {
      clearTimeout(this.visibilityTimeout);
      this.visibilityTimeout = null;
    }
    if (this.tooltipElement) {
      this.tooltipElement.removeEventListener(
        "pointerenter",
        this.onTooltipEnter,
      );
      this.tooltipElement.removeEventListener(
        "pointerleave",
        this.onTooltipLeave,
      );
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
    this.isTooltipVisible = false;
    this.activeElement = null;
    if (activeManager === this) activeManager = null;
  }

  cancelRemoval() {
    if (this.removalTimeout !== null) {
      clearTimeout(this.removalTimeout);
      this.removalTimeout = null;
    }
  }

  scheduleRemoval() {
    this.cancelRemoval();
    this.removalTimeout = setTimeout(() => this.removeTooltip(), 150);
  }

  handlePointerEvents(element, text, additionalClass) {
    let lastPointerType = null;
    const onPointerover = (event) => {
      if (event.pointerType !== "mouse") return;
      this.cancelRemoval();
      // Moving between children is not a new hover, including after Escape.
      if (element.contains(event.relatedTarget)) return;
      if (this.activeElement !== element) this.removeTooltip();
      this.activeElement = element;
      this.createTooltip(text, event.clientX, event.clientY, additionalClass);
    };
    const onPointerleave = (event) => {
      if (
        event.pointerType === "mouse" &&
        this.activeElement === element &&
        !this.tooltipElement.contains(event.relatedTarget)
      ) {
        this.scheduleRemoval();
      }
    };
    const onPointerdown = (event) => {
      lastPointerType = event.pointerType;
    };
    const onPointercancel = () => {
      lastPointerType = null;
    };
    const onClick = (event) => {
      // Some browsers deliver click as MouseEvent after a touch PointerEvent.
      const pointerType = event.pointerType || lastPointerType;
      lastPointerType = null;
      if (pointerType === "mouse" || event.button !== 0) return;
      if (this.isTooltipVisible && this.activeElement === element) {
        this.removeTooltip();
      } else {
        this.removeTooltip();
        this.activeElement = element;
        const rect = element.getBoundingClientRect();
        this.createTooltip(
          text,
          rect.left + rect.width / 2,
          rect.top - 30,
          additionalClass,
        );
      }
    };
    element.addEventListener("pointerover", onPointerover);
    element.addEventListener("pointerleave", onPointerleave);
    element.addEventListener("pointerdown", onPointerdown);
    element.addEventListener("pointercancel", onPointercancel);
    element.addEventListener("click", onClick);
    return () => {
      element.removeEventListener("pointerover", onPointerover);
      element.removeEventListener("pointerleave", onPointerleave);
      element.removeEventListener("pointerdown", onPointerdown);
      element.removeEventListener("pointercancel", onPointercancel);
      element.removeEventListener("click", onClick);
    };
  }

  handleInteraction(element, text, additionalClass = null) {
    const previousCleanup = this.interactions.get(element);
    if (previousCleanup) {
      previousCleanup();
      if (this.activeElement === element) this.removeTooltip();
    }

    const cleanup = this.handlePointerEvents(element, text, additionalClass);
    this.interactions.set(element, cleanup);

    if (!this.globalListenersAttached) {
      window.addEventListener("scroll", this.onScroll);
      document.addEventListener("click", this.onOutsideClick);
      document.addEventListener("keydown", this.onKeydown);
      this.globalListenersAttached = true;
    }
  }

  clearInteractions() {
    this.removeTooltip();
    for (const cleanup of this.interactions.values()) cleanup();
    this.interactions.clear();
    if (this.globalListenersAttached) {
      window.removeEventListener("scroll", this.onScroll);
      document.removeEventListener("click", this.onOutsideClick);
      document.removeEventListener("keydown", this.onKeydown);
      this.globalListenersAttached = false;
    }
  }
}

export { TooltipManager };
