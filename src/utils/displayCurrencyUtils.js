import { createContainer } from "../components/container.js";
import { showContextMenu } from "../components/contextMenu.js";
import { createLoadingSpinner, showLoader } from "../components/spinner.js";
import { getParsedData } from "./storageUtils.js";
import { widgetCurrencyRender } from "./widgetCurrencyRender.js";
import { showTooltip, hideTooltip } from "../components/tooltip.js";

const currencyContainer = createContainer("Small", "");
currencyContainer.id = "currencyWidget";
currencyContainer.classList.add("noise-background");
document.getElementById("col-1").appendChild(currencyContainer);

const loadingSpinner = createLoadingSpinner();
currencyContainer.appendChild(loadingSpinner);

function currencyButtonEventListeners() {
  const currencyPairButton = document.getElementById("currencyPair");
  currencyPairButton.addEventListener("click", showContextMenu);
}

function percentageEventListeners() {
  const percentageChangeElement = document.getElementById("percentageChange");
  percentageChangeElement.addEventListener("mouseover", function(event) {
    const currenciesData = getParsedData("currencies");
    const lastUpdated = currenciesData[0].lastUpdated;
    const formattedLastUpdated = formatLastUpdate(lastUpdated);
    const content = `Last updated: <span class="currency--tooltip-text-accent">${formattedLastUpdated}</span>`;
    showTooltip(content, event);
  });
  percentageChangeElement.addEventListener("mouseout", hideTooltip);
}

function formatLastUpdate(data) {
  if (!data) return "A long time ago 😔";
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  };
  return new Date(data).toLocaleString("en-US", options);
}

export function renderCurrencyContainer(content) {
  currencyContainer.innerHTML = content;
  currencyButtonEventListeners();
  percentageEventListeners();
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
