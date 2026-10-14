import "./styles/styles.css";
import { loadCurrencyWidget } from "./components/widgets/currencyWidget/currencyWidget.js";
import { initializeWidgets } from "./utils/widgetInitializer.js";
import { initializeThemeToggle } from "./components/ui/themeToggle/themeToggle.js";
import { initializeGridEditor } from "./components/ui/gridEditor/gridEditor.js";
import { closeWidgetOverlays } from "./utils/widgetOverlays.js";

function initializeDashboard() {
  initializeThemeToggle(document.getElementById("themeToggle"));
  const dashboard = initializeWidgets();
  initializeGridEditor(dashboard.widgets, {
    grid: document.getElementById("app"),
    toolbar: document.getElementById("gridEditor"),
    beforeEdit: () => closeWidgetOverlays(dashboard.widgets),
  });
  loadCurrencyWidget();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard, {
    once: true,
  });
} else {
  initializeDashboard();
}
