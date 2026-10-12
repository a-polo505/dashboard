import "./styles/styles.css";
import { initializeCurrencyWidget } from "./components/widgets/currencyWidget/currencyWidget.js";
import { initializeWidgets } from "./utils/widgetInitializer.js";
import { initializeInfoTooltip } from "./components/ui/tooltip/infoTooltip.js";

function initializeDashboard() {
  initializeWidgets();
  initializeCurrencyWidget();
  initializeInfoTooltip();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard, {
    once: true,
  });
} else {
  initializeDashboard();
}
