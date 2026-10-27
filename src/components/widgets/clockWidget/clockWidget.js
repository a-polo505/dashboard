import { WidgetContainer } from "../widget/WidgetContainer.js";
import { ClockWidgetRenderer } from "./clockWidgetRender.js";

export class ClockWidget {
  constructor() {
    this.renderer = new ClockWidgetRenderer();
    this.clockWidgetContainer = new WidgetContainer(
      this.renderer,
      "clock-widget-container",
    );
    this.clockWidgetContainer.addToDOM("widgets");
    this.clockWidgetContainer.renderWidgetContent();
    this.renderer.updateTime(new Date());
    this.frameId = null;
    this.destroyed = false;
    this.inViewport = typeof window.IntersectionObserver !== "function";
    this.onFrame = () => {
      this.frameId = null;
      if (!this.canAnimate()) return;
      this.renderer.updateTime(new Date());
      this.frameId = window.requestAnimationFrame(this.onFrame);
    };
    this.onVisibilityChange = () => this.updateAnimation();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    if (typeof window.IntersectionObserver === "function") {
      this.observer = new window.IntersectionObserver(([entry]) => {
        this.inViewport = entry.isIntersecting;
        this.updateAnimation();
      });
      this.observer.observe(this.clockWidgetContainer.container);
    }
    this.updateAnimation();
  }

  canAnimate() {
    return !this.destroyed && !document.hidden && this.inViewport;
  }

  updateAnimation() {
    if (!this.canAnimate()) {
      if (this.frameId !== null) window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    } else if (this.frameId === null) {
      this.renderer.updateTime(new Date());
      this.frameId = window.requestAnimationFrame(this.onFrame);
    }
  }

  destroy() {
    this.destroyed = true;
    this.updateAnimation();
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }
}
