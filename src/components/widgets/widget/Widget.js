import { createContainer } from "../../../utils/container.js";

class Widget {
  constructor(containerType = "Default", contentHTML = "") {
    this.container = createContainer(containerType, contentHTML);
  }

  addToDOM(parentClass = "widgets") {
    const parentElement = document.querySelector(`.${parentClass}`);
    if (parentElement) {
      parentElement.appendChild(this.container);
    } else {
      console.error(`Parent element with class ${parentClass} not found`);
    }
  }
}

export { Widget };
