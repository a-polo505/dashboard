class Widget {
  constructor(containerType = "Default", contentHTML = "") {
    this.container = document.createElement("div");
    this.container.classList.add(
      "Container",
      "gradient-border",
      `Container--${containerType.toLowerCase()}`,
    );
    this.container.innerHTML = contentHTML;
  }

  addToDOM(parentId) {
    const parentElement = document.getElementById(parentId);
    if (parentElement) {
      parentElement.appendChild(this.container);
    } else {
      console.error(`Parent element with id ${parentId} not found`);
    }
  }

  appendContent(content) {
    this.container.appendChild(content);
  }
}

export { Widget };
