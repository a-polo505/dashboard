import { Dashboard } from "./dashboard.js";
import { widgetDefinitions } from "./widgetRegistry.js";

let dashboard;

export function initializeWidgets() {
  if (dashboard) return dashboard;
  if (!document.querySelector(".widgets")) {
    throw new Error("Widget parent element not found");
  }

  const initializedDashboard = new Dashboard();
  for (const { id, name, mount } of widgetDefinitions) {
    initializedDashboard.addWidget({ id, name, container: mount() });
  }

  dashboard = initializedDashboard;
  return dashboard;
}
