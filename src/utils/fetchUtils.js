import { prepareCurrencyData } from "./currencyDataValidation.js";
import { cacheCurrencyData, readCachedCurrencyData } from "./currencyCache.js";
import {
  renderCurrencyContainer,
  renderCurrencyLoading,
  renderCurrencyError,
} from "./displayCurrencyUtils.js";

const CURRENCY_REQUEST_TIMEOUT_MS = 15_000;

let refreshInterval;
let pendingRequest;
let hasDisplayedRates = false;

function displayCachedData() {
  try {
    const prepared = readCachedCurrencyData();
    if (!prepared) return false;
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

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    CURRENCY_REQUEST_TIMEOUT_MS,
  );
  try {
    const response = await fetch("/api/currencies", {
      headers: { "Cache-Control": "no-cache" },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
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
