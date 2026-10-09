import { mountCurrencyWidget } from "../../../utils/displayCurrencyUtils.js";
import { fetchDataAndDisplay } from "../../../utils/fetchUtils.js";

export function initializeCurrencyWidget() {
  mountCurrencyWidget();
  return fetchDataAndDisplay();
}
