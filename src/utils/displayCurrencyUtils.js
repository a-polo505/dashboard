import { createContainer } from "./container.js";
import { showContextMenu } from "../components/ui/contextMenu/currencyContextMenu.js";
import {
  createLoadingSpinner,
  showLoader,
} from "../components/ui/spinner/spinner.js";
import { getParsedData } from "./storageUtils.js";
import { widgetCurrencyRender } from "./widgetCurrencyRender.js";
import { TooltipManager } from "../components/ui/tooltip/TooltipManager.js";

let currencyContainer;
const tooltipManager = new TooltipManager();

export function mountCurrencyWidget() {
  if (currencyContainer) {
    return currencyContainer;
  }

  const parent = document.querySelector(".widgets");
  if (!parent) {
    throw new Error("Currency widget parent element not found");
  }

  currencyContainer = createContainer("Small", "");
  currencyContainer.id = "currencyWidget";
  currencyContainer.classList.add("currency-widget-container");
  // Keep the original DOM order when mounting after the other widgets.
  parent.prepend(currencyContainer);
  currencyContainer.appendChild(createLoadingSpinner());
  document.addEventListener("currencyChange", handleCurrencyChange);
  return currencyContainer;
}

function currencyButtonEventListeners() {
  const currencyPairButton = document.getElementById("currencyPair");
  currencyPairButton.addEventListener("click", showContextMenu);
}

function percentageEventListeners() {
  const percentageChangeElement = document.getElementById("percentageChange");
  tooltipManager.handleInteraction(percentageChangeElement, getTooltipText);
}

function getTooltipText() {
  let lastUpdated;
  try {
    lastUpdated = getParsedData("currencies")?.[0]?.lastUpdated;
  } catch {
    // Optional cache access must not prevent opening the tooltip.
  }
  return `Last updated: ${formatLastUpdate(lastUpdated)}`;
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
  tooltipManager.clearInteractions();
  currencyContainer.innerHTML = content;
  currencyButtonEventListeners();
  percentageEventListeners();
}

export function renderCurrencyLoading() {
  tooltipManager.clearInteractions();
  const spinner = createLoadingSpinner();
  spinner.setAttribute("role", "status");
  spinner.setAttribute("aria-label", "Loading currency rates");
  currencyContainer.replaceChildren(spinner);
  showLoader();
}

export function renderCurrencyError(retry) {
  tooltipManager.clearInteractions();
  const content = document.createElement("div");
  content.classList.add("flex", "flex-col", "justify-between", "h-100");

  const message = document.createElement("p");
  message.textContent = "Currency rates are unavailable. Please try again.";
  message.setAttribute("role", "alert");

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("currency--button");
  button.textContent = "Try again";
  button.addEventListener("click", retry);

  content.append(message, button);
  currencyContainer.replaceChildren(content);
}

function handleCurrencyChange(event) {
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
}
