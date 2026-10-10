import { createContainer } from "./container.js";
import {
  showContextMenu,
  closeContextMenu,
} from "../components/ui/contextMenu/currencyContextMenu.js";
import {
  createLoadingSpinner,
  showLoader,
} from "../components/ui/spinner/spinner.js";
import { widgetCurrencyRender } from "./widgetCurrencyRender.js";
import { TooltipManager } from "../components/ui/tooltip/TooltipManager.js";

let currencyContainer;
let currentData;
let userCurrency;
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
  currencyPairButton.addEventListener("click", () => {
    if (currentData)
      showContextMenu(Object.keys(currentData.currencies[0].data));
  });
}

function percentageEventListeners() {
  const percentageChangeElement = document.getElementById("percentageChange");
  tooltipManager.handleInteraction(percentageChangeElement, getTooltipText);
}

function getTooltipText() {
  const lastUpdated = currentData?.currencies[0]?.lastUpdated;
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

function readStoredCurrency() {
  try {
    return localStorage.getItem("userCurrency");
  } catch {
    return null;
  }
}

export function renderCurrencyContainer(data) {
  const selection = userCurrency ?? readStoredCurrency();
  const content = widgetCurrencyRender(
    data.currencies,
    data.currenciesDiff,
    selection,
  );
  const available = Object.prototype.hasOwnProperty.call(
    data.currencies[0].data,
    selection,
  );
  if (selection !== null && !available) {
    try {
      localStorage.removeItem("userCurrency");
    } catch {
      // Recover in memory even if the invalid preference cannot be removed.
    }
  }
  closeContextMenu();
  tooltipManager.clearInteractions();
  currentData = data;
  userCurrency = available ? selection : "UAH";
  currencyContainer.innerHTML = content;
  currencyButtonEventListeners();
  percentageEventListeners();
}

export function renderCurrencyLoading() {
  closeContextMenu();
  tooltipManager.clearInteractions();
  currentData = undefined;
  const spinner = createLoadingSpinner();
  spinner.setAttribute("role", "status");
  spinner.setAttribute("aria-label", "Loading currency rates");
  currencyContainer.replaceChildren(spinner);
  showLoader();
}

export function renderCurrencyError(retry) {
  closeContextMenu();
  tooltipManager.clearInteractions();
  currentData = undefined;
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
  const selection = event.detail?.userCurrency;
  if (
    !currentData ||
    typeof selection !== "string" ||
    !Object.prototype.hasOwnProperty.call(
      currentData.currencies[0].data,
      selection,
    )
  )
    return;
  userCurrency = selection;
  renderCurrencyContainer(currentData);
  try {
    localStorage.setItem("userCurrency", selection);
  } catch {
    // Persistence is optional; the current selection already works in memory.
  }
}
