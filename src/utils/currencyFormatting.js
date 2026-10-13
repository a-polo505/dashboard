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
  const rate = truncateDecimals(value, RATE_DECIMAL_PLACES).toString();
  const exponentIndex = rate.indexOf("e");
  if (exponentIndex !== -1) {
    const mantissa = rate.slice(0, exponentIndex);
    const exponent = rate.slice(exponentIndex);
    // Reserve the complete exponent before shortening the displayed mantissa.
    return truncateText(mantissa, RATE_MAX_LENGTH - exponent.length) + exponent;
  }
  return truncateText(rate, RATE_MAX_LENGTH);
}
