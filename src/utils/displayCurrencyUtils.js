import { createContainer } from "../components/container.js";
import { showContextMenu } from "../components/contextMenu.js";
import { createLoadingSpinner, showLoader } from "../components/spinner.js";
import { getParsedData } from "./storageUtils.js";
import { widgetCurrencyRender } from "./widgetCurrencyRender.js";

const currencyContainer = createContainer("Small", "");
currencyContainer.id = "currencyWidget";
currencyContainer.classList.add("noise-background");
document.getElementById("col-1").appendChild(currencyContainer);

const loadingSpinner = createLoadingSpinner();
currencyContainer.appendChild(loadingSpinner);

function addEventListeners() {
  const currencyPairButton = document.getElementById("currencyPair");
  currencyPairButton.addEventListener("click", showContextMenu);

  const percentageChangeElement = document.getElementById("percentageChange");
  percentageChangeElement.addEventListener("mouseover", showTooltip);
  percentageChangeElement.addEventListener("mouseout", hideTooltip);

  document.addEventListener("click", function hideTooltipOnClick(event) {
    if (!event.target.classList.contains("currency--percentage")) {
      hideTooltip();
      document.removeEventListener("click", hideTooltipOnClick);
    }
  });

  window.addEventListener("scroll", hideTooltipOnScroll);
}

function showTooltip(event) {
  const tooltip = document.createElement("div");
  tooltip.textContent = `NOW`;
  tooltip.classList.add("tooltip");

  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;

  document.body.appendChild(tooltip);

  window.addEventListener("scroll", hideTooltipOnScroll);
}

function hideTooltip() {
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

function hideTooltipOnScroll() {
  hideTooltip();
  window.removeEventListener("scroll", hideTooltipOnScroll);
}

export function renderCurrencyContainer(content) {
  currencyContainer.innerHTML = content;
  addEventListeners();
}

document.addEventListener("currencyChange", (event) => {
  const userCurrency = event.detail.userCurrency;

  showLoader();

  const parsedData = getParsedData("currencies");
  const parsedOldData = getParsedData("currenciesDiff");

  const currencyContainerContent = widgetCurrencyRender(
    parsedData,
    parsedOldData,
    userCurrency,
  );

  renderCurrencyContainer(currencyContainerContent);
});
