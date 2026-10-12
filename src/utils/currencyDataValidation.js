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
