import "./styles/styles.css";
import { initializeCurrencyWidget } from "./components/widgets/currencyWidget/currencyWidget.js";
import { initializeWidgets } from "./utils/widgetInitializer.js";
import { initializeThemeToggle } from "./components/ui/themeToggle/themeToggle.js";

function initializeDashboard() {
  initializeThemeToggle(document.getElementById("themeToggle"));
  initializeWidgets();
  initializeCurrencyWidget();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard, {
    once: true,
  });
} else {
  initializeDashboard();
}
