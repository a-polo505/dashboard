import {
  createDefaultLayout,
  layoutsEqual,
  normalizeLayout,
} from "./dashboardLayout.js";

const LAYOUT_KEY = "dashboardLayout";
const LAYOUT_VERSION = 1;

function removeInvalidLayout() {
  try {
    localStorage.removeItem(LAYOUT_KEY);
  } catch {
    // The default layout remains usable if invalid stored data cannot be removed.
  }
}

export function readDashboardLayout(widgetIds) {
  const defaults = createDefaultLayout(widgetIds);
  let raw;
  try {
    raw = localStorage.getItem(LAYOUT_KEY);
  } catch {
    return defaults;
  }
  if (raw === null) return defaults;

  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    removeInvalidLayout();
    return defaults;
  }

  if (
    snapshot &&
    Number.isInteger(snapshot.version) &&
    snapshot.version > LAYOUT_VERSION
  ) {
    // A newer application may own this format; do not destroy its preferences.
    return defaults;
  }

  const normalized =
    snapshot?.version === LAYOUT_VERSION
      ? normalizeLayout(snapshot.widgets, widgetIds)
      : null;
  if (!normalized || layoutsEqual(normalized, defaults)) {
    removeInvalidLayout();
    return defaults;
  }
  return normalized;
}

export function saveDashboardLayout(layout, widgetIds) {
  const defaults = createDefaultLayout(widgetIds);
  const normalized = normalizeLayout(layout, widgetIds);
  // Save only complete current layouts; reconciliation belongs to reading.
  if (!normalized || !layoutsEqual(layout, normalized)) return false;

  try {
    if (layoutsEqual(normalized, defaults)) {
      localStorage.removeItem(LAYOUT_KEY);
    } else {
      localStorage.setItem(
        LAYOUT_KEY,
        JSON.stringify({ version: LAYOUT_VERSION, widgets: normalized }),
      );
    }
    return true;
  } catch {
    return false;
  }
}
