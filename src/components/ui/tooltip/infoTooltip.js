import { TooltipManager } from "./TooltipManager.js";

const tooltipManager = new TooltipManager();
const infoIconElement = document.querySelector(".info-icon");

const tooltipText = `
  <p>Welcome to Widget Dashboard ✨</p>
  <p>These interactive widgets are designed to inspire and enhance your digital experience.</p>
  <p>Created just for fun.</p>
`;

tooltipManager.handleMouseOver(infoIconElement, tooltipText, "info-tooltip");
tooltipManager.handleMouseLeave(infoIconElement);
