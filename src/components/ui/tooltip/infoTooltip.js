import { TooltipManager } from "./TooltipManager.js";

let tooltipManager;

const tooltipText = `
  <p>Welcome to Widget Dashboard ✨</p>
  <p>These interactive widgets are designed to inspire and enhance your digital experience.</p>
  <p>Created just for fun.</p>
`;

export function initializeInfoTooltip() {
  if (tooltipManager) return;
  const infoIconElement = document.querySelector(".info-icon");
  if (!infoIconElement) return;

  const manager = new TooltipManager();
  manager.handleInteraction(infoIconElement, tooltipText, "info-tooltip");
  tooltipManager = manager;
}
