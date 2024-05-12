export function createContainer(containerType = "Default", contentHTML = "") {
  const container = document.createElement("div");
  container.classList.add(
    "Container",
    "gradient-border",
    `Container--${containerType.toLowerCase()}`,
  );

  container.innerHTML = contentHTML;

  return container;
}
