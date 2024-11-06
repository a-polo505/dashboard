class Widget {
  constructor(containerType = "Default", contentHTML = "") {
    this.container = document.createElement("div");
    this.container.classList.add(
      "Container",
      "gradient-border",
      `Container--${containerType.toLowerCase()}`
    );
    this.container.innerHTML = contentHTML;
  }

  addToDOM(parentClass = "widgets") {
    const parentElement = document.querySelector(`.${parentClass}`);
    if (parentElement) {
      parentElement.appendChild(this.container);
    } else {
      console.error(`Parent element with class ${parentClass} not found`);
    }
  }

  appendContent(content) {
    this.container.appendChild(content);
  }
}

export { Widget };