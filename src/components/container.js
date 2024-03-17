export function createContainer(containerType = "Default", contentHTML = "") {
    const container = document.createElement("div");
    container.classList.add("Container");
    container.classList.add("gradient-border");
    container.classList.add(`Container--${containerType.toLowerCase()}`);
  
    container.innerHTML = contentHTML;
  
    return container;
  }
  