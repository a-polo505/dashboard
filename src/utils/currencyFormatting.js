import {
  RATE_DECIMAL_PLACES,
  truncateDecimals,
} from "./currencyCalculations.js";

const RATE_MAX_LENGTH = 9;

export function truncateText(text, maxLength) {
  const textString = text.toString();
  if (textString.length <= maxLength) {
    return textString;
  }

  let truncatedText = textString.slice(0, maxLength);
  if (truncatedText.endsWith(".")) {
    truncatedText = truncatedText.slice(0, -1);
  }

  return truncatedText;
}

export function formatCurrencyRate(value) {
  return truncateText(
    truncateDecimals(value, RATE_DECIMAL_PLACES),
    RATE_MAX_LENGTH,
  );
}
