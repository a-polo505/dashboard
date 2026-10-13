const CURRENCY_KEY = "userCurrency";

export function readCurrencyPreference() {
  try {
    return localStorage.getItem(CURRENCY_KEY);
  } catch {
    return null;
  }
}

export function saveCurrencyPreference(currency) {
  try {
    localStorage.setItem(CURRENCY_KEY, currency);
  } catch {
    // Persistence is optional; the active selection still works in memory.
  }
}

export function removeCurrencyPreference() {
  try {
    localStorage.removeItem(CURRENCY_KEY);
  } catch {
    // Recover in memory even if an invalid preference cannot be removed.
  }
}
