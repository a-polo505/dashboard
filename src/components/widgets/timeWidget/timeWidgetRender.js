import { TooltipManager } from "../../ui/tooltip/TooltipManager.js";

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

  render(remainingPercentage) {
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

    container.appendChild(this.createTimeSVG(remainingPercentage));
    return container;
  }

  createTimeSVG(remainingPercentage) {
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
        this.getArcBackground(),
        remainingPercentage,
      ),
    );
    svg.appendChild(
      this.createPath(
        "#progress-path-filled",
        "url(#gradient)",
        this.getArc(remainingPercentage),
        remainingPercentage,
      ),
    );
    svg.appendChild(
      SVGElementFactory.createCircle({ cx: 50, cy: 10, r: 6, fill: "#FFFFFF" }),
    );
    const [endX, endY] = this.getEndCoordinates(remainingPercentage);
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
          textContent: remainingPercentage,
        },
        `${remainingPercentage}%`,
      ),
    );
    return svg;
  }

  createPath(id, strokeColor, pathData, remainingPercentage) {
    const path = SVGElementFactory.createPath({
      id,
      fill: "none",
      "stroke-width": 12,
      stroke: strokeColor,
      d: pathData,
    });
    const leftPercentage = 100 - remainingPercentage;
    this.tooltipManager.handleMouseOver(
      path,
      `Remaining time until end of day: ${leftPercentage.toFixed(2)}%`,
    );
    this.tooltipManager.handleMouseLeave(path);
    this.tooltipManager.handleScroll();
    this.tooltipManager.handleTooltipClick();
    return path;
  }

  createCircle() {}

  getEndCoordinates(remainingPercentage) {
    const radius = 40;
    const totalLength = 2 * Math.PI * radius;
    const arcLength = (remainingPercentage / 100) * totalLength;
    const endX = 50 + Math.sin(arcLength / radius) * radius;
    const endY = 50 - Math.cos(arcLength / radius) * radius;
    return [endX, endY];
  }

  getArc(remainingPercentage) {
    const radius = 40;
    const startX = 50 + Math.sin(0) * radius;
    const startY = 50 - Math.cos(0) * radius;
    const [endX, endY] = this.getEndCoordinates(remainingPercentage);
    const largeArcFlag = remainingPercentage > 50 ? 1 : 0;
    return `M${startX},${startY} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}`;
  }

  getArcBackground() {
    const radius = 40;
    return `M50,50 m0,-${radius} a${radius},${radius} 0 1,0 0,${2 * radius} a${radius},${radius} 0 1,0 0,-${2 * radius}`;
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
