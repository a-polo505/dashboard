export function truncateDecimals(number, digits) {
  const numString = number.toString();
  const decimalIndex = numString.indexOf(".");

  if (decimalIndex !== -1) {
    const truncatedNumber = numString.slice(0, decimalIndex + digits + 1);
    return parseFloat(truncatedNumber);
  }

  return number;
}

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

export function calculatePercentageChange(
  quoteCurrencyCode,
  currenciesDiff,
  quoteCurrency,
) {
  const quoteCurrencyData = currenciesDiff[0].data[quoteCurrencyCode];
  if (!quoteCurrencyData) {
    return { percentageChange: "0.00%", percentageClass: "neutral" };
  }

  const diffValue = currenciesDiff[0].data[quoteCurrencyCode].value;
  const change = quoteCurrency.value - diffValue;
  const percentage = (change / diffValue) * 100;

  const icon = percentage > 0 ? "up" : percentage < 0 ? "down" : "equal";

  const formattedPercentage =
    percentage !== 0 ? Math.abs(percentage.toFixed(2)) : "0.00";
  const percentageChange = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="${getIconPath(icon)}" />
          </svg> ${formattedPercentage}%`;
  const percentageClass = getPercentageClass(percentage);

  return { percentageChange, percentageClass };
}

export function widgetCurrencyRender(currencies, currenciesDiff) {
  const defaultCurrencyCode = "USD";
  const defaultCurrency = currencies[0].data[defaultCurrencyCode];
  const defaultCurrencyName = defaultCurrency.code;

  const quoteCurrencyCode = getUserCurrency();
  const quoteCurrency = currencies[0].data[quoteCurrencyCode];
  const quoteCurrencyName = quoteCurrency.code;

  const { percentageChange, percentageClass } = calculatePercentageChange(
    quoteCurrencyCode,
    currenciesDiff,
    quoteCurrency,
  );

  const quoteCurrencyValue = truncateText(
    truncateDecimals(quoteCurrency.value, 4),
    9,
  );

  const currencyContent = `
          <div class="flex align-left flex-col justify-between h-100">
              <div class="flex flex-col gap-10 wrap align-letf">
                  <button id="currencyPair" class="flex justify-center currency--button">${defaultCurrencyName} / ${quoteCurrencyName}</button>
                  <div id="rate" class="flex currency--rate">${quoteCurrencyValue}</div>
              </div>
              <div class="flex justify-between w-100 currency--statistic">
                  <div id="baseCurrency" class="currency--base">${defaultCurrencyName}</div>
                  <div id="percentageChange" class="flex align-center currency--percentage ${percentageClass}">${percentageChange}</div>
              </div>
          </div>
      `;

  return currencyContent;
}

function getUserCurrency() {
  const storedCurrency = localStorage.getItem("userCurrency");
  return storedCurrency ? storedCurrency : "UAH";
}

function getIconPath(icon) {
  if (icon === "up") {
    return "M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z";
  } else if (icon === "down") {
    return "M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z";
  } else {
    return "";
  }
}

function getPercentageClass(percentage) {
  return percentage > 0 ? "positive" : percentage < 0 ? "negative" : "neutral";
}
