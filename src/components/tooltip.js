let tooltipElement;

export function showTooltip(content, event) {
  tooltipElement = document.createElement("div");
  tooltipElement.innerHTML = content;
  tooltipElement.classList.add("tooltip");

  tooltipElement.style.left = `${event.clientX}px`;
  tooltipElement.style.top = `${event.clientY}px`;

  document.body.appendChild(tooltipElement);

  window.addEventListener("scroll", hideTooltipOnScroll);
}

export function hideTooltip() {
    console.log('hideTooltip func')
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
