const DATE_KEY = "selectedDate";

export function readCountdownDate(fallback = null) {
  try {
    return localStorage.getItem(DATE_KEY);
  } catch {
    // Preserve the active date when the storage backend cannot be read.
    return fallback;
  }
}

export function saveCountdownDate(date) {
  try {
    localStorage.setItem(DATE_KEY, date);
  } catch {
    // Keep the selected date usable in memory if storage is unavailable.
  }
}

export function removeCountdownDate() {
  try {
    localStorage.removeItem(DATE_KEY);
  } catch {
    // Invalid cached dates can still be discarded from the active widget.
  }
}
