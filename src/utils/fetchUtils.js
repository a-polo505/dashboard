import { isValidCurrencyData } from "./currencyDataValidation.js";
import { cacheCurrencyData } from "./currencyCache.js";
import { getParsedData } from "./storageUtils.js";
import {
  renderCurrencyContainer,
  renderCurrencyLoading,
  renderCurrencyError,
} from "./displayCurrencyUtils.js";

let refreshInterval;
let pendingRequest;
let hasDisplayedRates = false;

function prepareCurrencyData(data) {
  if (
    !Array.isArray(data?.currencies) ||
    data.currencies.length !== 1 ||
    !isValidCurrencyData(data.currencies[0]?.data)
  ) {
    throw new Error("Invalid currency response");
  }

  // Historical rates are optional; current rates must pass the shared validation.
  const currenciesDiff = Array.isArray(data.currenciesDiff)
    ? data.currenciesDiff
    : [];
  return {
    currencies: data.currencies,
    currenciesDiff,
  };
}

function displayCachedData() {
  try {
    const prepared = prepareCurrencyData({
      currencies: getParsedData("currencies"),
      currenciesDiff: getParsedData("currenciesDiff"),
    });
    renderCurrencyContainer(prepared);
    hasDisplayedRates = true;
    return true;
  } catch {
    return false;
  }
}

async function requestCurrencyData() {
  if (!hasDisplayedRates && !displayCachedData()) {
    renderCurrencyLoading();
  }

  try {
    const response = await fetch("/api/currencies", {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) {
      throw new Error(`Currency request failed (HTTP ${response.status})`);
    }

    const prepared = prepareCurrencyData(await response.json());
    renderCurrencyContainer(prepared);
    hasDisplayedRates = true;
    cacheCurrencyData(prepared);
  } catch (error) {
    console.error("Error fetching and updating data:", error);
    if (!hasDisplayedRates) {
      renderCurrencyError(fetchAndUpdateData);
    }
  }
}

export function fetchAndUpdateData() {
  if (!pendingRequest) {
    pendingRequest = requestCurrencyData().finally(() => {
      pendingRequest = undefined;
    });
  }
  return pendingRequest;
}

export async function fetchDataAndDisplay() {
  if (refreshInterval === undefined) {
    refreshInterval = setInterval(fetchAndUpdateData, 60 * 60 * 1000);
  }

  if (!hasDisplayedRates && !displayCachedData()) {
    await fetchAndUpdateData();
  }
}
