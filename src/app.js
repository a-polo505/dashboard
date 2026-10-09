import "./styles/styles.css";
import { initializeCurrencyWidget } from "./components/widgets/currencyWidget/currencyWidget.js";
import "./utils/widgetInitializer.js";
import "./components/ui/tooltip/infoTooltip.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCurrencyWidget, {
    once: true,
  });
} else {
  initializeCurrencyWidget();
}
