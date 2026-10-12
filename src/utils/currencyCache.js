import { prepareCurrencyData } from "./currencyDataValidation.js";
import { getParsedData } from "./storageUtils.js";

const SNAPSHOT_KEY = "currencySnapshot";

export function readCachedCurrencyData() {
  try {
    const snapshot = sessionStorage.getItem(SNAPSHOT_KEY);
    if (snapshot !== null) {
      return prepareCurrencyData(JSON.parse(snapshot));
    }

    const legacyData = prepareCurrencyData({
      currencies: getParsedData("currencies"),
      currenciesDiff: getParsedData("currenciesDiff"),
    });
    cacheCurrencyData(legacyData);
    return legacyData;
  } catch {
    // Invalid or inaccessible cache must not prevent a fresh request.
    return null;
  }
}

export function cacheCurrencyData(data) {
  try {
    const snapshot = JSON.stringify(prepareCurrencyData(data));
    sessionStorage.setItem(SNAPSHOT_KEY, snapshot);
  } catch {
    // A storage failure must not discard successfully loaded rates on screen.
    console.error("Error caching currency data");
    return;
  }

  for (const key of ["currencies", "currenciesDiff"]) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // The new snapshot remains authoritative if legacy cleanup is unavailable.
    }
  }
}
