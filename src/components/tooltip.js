let tooltipElement;

export function showTooltip(content, parent, event) {
  tooltipElement = document.createElement("div");
  tooltipElement.innerHTML = content;
  tooltipElement.classList.add("tooltip");

  tooltipElement.style.left = `${event.clientX}px`;
  tooltipElement.style.top = `${event.clientY}px`;

  document.body.appendChild(tooltipElement);

  document.addEventListener("click", function hideTooltipOnClick(event) {
    if (
      !event.target.classList.contains(parent) &&
      !event.target.classList.contains("tooltip")
    ) {
      hideTooltip();
      document.removeEventListener("click", hideTooltipOnClick);
    }
  });

  window.addEventListener("scroll", hideTooltipOnScroll);
}

export function hideTooltip() {
  console.log("hideTooltip func");
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }

  window.removeEventListener("scroll", hideTooltipOnScroll);
}

export function hideTooltipOnScroll() {
  if (tooltipElement) {
    hideTooltip();
  }
  window.removeEventListener("scroll", hideTooltipOnScroll);
}
