import fetch from "node-fetch";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidCurrencyData(currencies) {
  if (
    !isRecord(currencies) ||
    !Object.hasOwn(currencies, "USD") ||
    !Object.hasOwn(currencies, "UAH")
  ) {
    return false;
  }

  return Object.entries(currencies).every(
    ([code, currency]) =>
      code.length > 0 &&
      !/[^A-Z0-9]/.test(code) &&
      isRecord(currency) &&
      currency.code === code &&
      Number.isFinite(currency.value) &&
      currency.value > 0,
  );
}

export async function getCurrencies() {
  const apiKey = process.env.CURRENCYAPI_API_KEY;
  const apiUrl = process.env.CURRENCYAPI_API_URL;

  let response;
  try {
    response = await fetch(`${apiUrl}?apikey=${apiKey}`);
  } catch {
    // Fetch errors can contain the request URL and its API key.
    throw new Error("Currency API request failed");
  }

  if (!response.ok) {
    throw new Error(`Currency API request failed (HTTP ${response.status})`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Currency API returned invalid JSON");
  }

  if (!isRecord(payload) || !isValidCurrencyData(payload.data)) {
    throw new Error("Currency API returned invalid currency data");
  }

  return payload.data;
}
