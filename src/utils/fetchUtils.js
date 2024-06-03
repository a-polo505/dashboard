import { widgetCurrencyRender } from "./widgetCurrencyRender.js";
import { showLoader } from "../components/ui/spinner/spinner.js";
import { getParsedData } from "./storageUtils.js";
import { renderCurrencyContainer } from "./displayCurrencyUtils.js";

export async function fetchAndUpdateData() {
  try {
    const response = await fetch("/api/currencies", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    const data = await response.json();

    showLoader();

    localStorage.setItem("currencies", JSON.stringify(data.currencies));
    localStorage.setItem("currenciesDiff", JSON.stringify(data.currenciesDiff));
    const currencyContainerContent = widgetCurrencyRender(
      data.currencies,
      data.currenciesDiff,
    );

    renderCurrencyContainer(currencyContainerContent);
  } catch (error) {
    console.error("Error fetching and updating data:", error);
  }
}

export async function fetchDataAndDisplay() {
  try {
    showLoader();
    const parsedData = getParsedData("currencies");
    const parsedOldData = getParsedData("currenciesDiff");

    if (parsedData) {
      const currencyContainerContent = widgetCurrencyRender(
        parsedData,
        parsedOldData,
      );
      renderCurrencyContainer(currencyContainerContent);
    } else {
      await fetchAndUpdateData();
    }

    setInterval(fetchAndUpdateData, 5 * 60 * 1000);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
