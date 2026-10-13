import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";
import {
  getEndCoordinates,
  getArc,
  getArcBackground,
} from "./timeWidgetGeometry.js";

class SVGElementFactory {
  static createSVGElement(tagName, attributes = {}, textContent = null) {
    const namespace = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(namespace, tagName);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    if (textContent !== null) {
      const textNode = document.createTextNode(textContent);
      element.appendChild(textNode);
    }
    return element;
  }

  static createCircle(attributes = {}) {
    return this.createSVGElement("circle", attributes);
  }

  static createPath(attributes = {}) {
    return this.createSVGElement("path", attributes);
  }

  static createText(attributes = {}, textContent = null) {
    return this.createSVGElement("text", attributes, textContent);
  }
}

class TimeWidgetRenderer {
  constructor() {
    this.tooltipManager = new TooltipManager();
  }

  render(elapsedPercentage) {
    this.tooltipManager.clearInteractions();
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "h-100",
      "wrapper",
      "gap-8",
    );

    const containerText = `
      <div class="flex flex-col align-center label">
              ${this.getHeaderText()}
          </div>
  `;

    container.innerHTML = containerText;

    container.appendChild(this.createTimeSVG(elapsedPercentage));
    return container;
  }

  createTimeSVG(elapsedPercentage) {
    const svg = SVGElementFactory.createSVGElement("svg", {
      id: "progress-circle",
      width: "100%",
      height: "100%",
      viewBox: "0 0 100 100",
    });
    svg.appendChild(this.createGradient());
    svg.appendChild(
      this.createPath(
        "#progress-path",
        "#201E43",
        getArcBackground(),
        elapsedPercentage,
      ),
    );
    svg.appendChild(
      this.createPath(
        "#progress-path-filled",
        "url(#gradient)",
        getArc(elapsedPercentage),
        elapsedPercentage,
      ),
    );
    svg.appendChild(
      SVGElementFactory.createCircle({ cx: 50, cy: 10, r: 6, fill: "#FFFFFF" }),
    );
    const [endX, endY] = getEndCoordinates(elapsedPercentage);
    svg.appendChild(
      SVGElementFactory.createCircle({
        cx: endX,
        cy: endY,
        r: 6,
        fill: "#FFFFFF",
      }),
    );
    svg.appendChild(
      SVGElementFactory.createText(
        {
          x: 50,
          y: 50,
          "text-anchor": "middle",
          id: "svgText",
          "alignment-baseline": "central",
          textContent: elapsedPercentage,
        },
        `${elapsedPercentage}%`,
      ),
    );
    return svg;
  }

  createPath(id, strokeColor, pathData, elapsedPercentage) {
    const path = SVGElementFactory.createPath({
      id,
      fill: "none",
      "stroke-width": 12,
      stroke: strokeColor,
      d: pathData,
    });
    const remainingPercentage = 100 - elapsedPercentage;
    this.tooltipManager.handleInteraction(
      path,
      `Remaining time until end of day: ${remainingPercentage.toFixed(2)}%`,
    );
    return path;
  }

  createGradient() {
    const gradient = SVGElementFactory.createSVGElement("linearGradient", {
      id: "gradient",
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%",
    });
    gradient.appendChild(
      SVGElementFactory.createSVGElement("stop", {
        offset: "0%",
        "stop-color": "#7AFB7A",
      }),
    );
    gradient.appendChild(
      SVGElementFactory.createSVGElement("stop", {
        offset: "100%",
        "stop-color": "#A87FF2",
      }),
    );
    return gradient;
  }

  getHeaderText() {
    return "Day's progress";
  }
}

export { TimeWidgetRenderer };
