export const RATE_DECIMAL_PLACES = 4;

export function truncateDecimals(number, digits) {
  const numString = number.toString();
  const decimalIndex = numString.indexOf(".");

  if (decimalIndex !== -1) {
    const truncatedNumber = numString.slice(0, decimalIndex + digits + 1);
    return parseFloat(truncatedNumber);
  }

  return number;
}

export function calculatePercentageChange(
  quoteCurrencyCode,
  currenciesDiff,
  quoteCurrency,
) {
  const quoteCurrencyData = currenciesDiff?.[0]?.data?.[quoteCurrencyCode];
  if (
    !quoteCurrencyData ||
    !Number.isFinite(quoteCurrencyData.value) ||
    quoteCurrencyData.value <= 0
  ) {
    return null;
  }

  const diffValue = truncateDecimals(
    quoteCurrencyData.value,
    RATE_DECIMAL_PLACES,
  );
  if (diffValue === 0) {
    return null;
  }

  const currentValue = truncateDecimals(
    quoteCurrency.value,
    RATE_DECIMAL_PLACES,
  );
  const change = currentValue - diffValue;
  const percentage = Number(((change / diffValue) * 100).toFixed(2));

  // Normalize negative zero so all consumers use the same neutral result.
  return percentage === 0 ? 0 : percentage;
}
