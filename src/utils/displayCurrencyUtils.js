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
