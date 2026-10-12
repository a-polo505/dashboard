export function isValidCurrencyData(currencyData) {
  return (
    currencyData !== null &&
    typeof currencyData === "object" &&
    !Array.isArray(currencyData) &&
    Object.prototype.hasOwnProperty.call(currencyData, "USD") &&
    Object.prototype.hasOwnProperty.call(currencyData, "UAH") &&
    Object.entries(currencyData).every(
      ([code, currency]) =>
        code.length > 0 &&
        !/[^A-Z0-9]/.test(code) &&
        currency?.code === code &&
        Number.isFinite(currency.value) &&
        currency.value > 0,
    )
  );
}

export function prepareCurrencyData(data) {
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
