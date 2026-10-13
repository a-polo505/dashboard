const PROGRESS_KEY = "coffeeCupsProgress";
const DATE_KEY = "coffeeCupsDate";

export function readCoffeeProgress(date, maxCups) {
  try {
    if (localStorage.getItem(DATE_KEY) === date) {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      if (
        Array.isArray(progress) &&
        progress.length === maxCups &&
        progress.every((cup) => typeof cup === "boolean")
      ) {
        return progress;
      }
    }
  } catch {
    // Invalid or inaccessible storage is handled by the widget's fallback.
  }
  return null;
}

export function saveCoffeeProgress(cups, date) {
  try {
    // Write progress first so a failed reset cannot relabel old data as today.
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(cups));
    localStorage.setItem(DATE_KEY, date);
  } catch {
    // Keep the widget interactive in memory when persistence is unavailable.
  }
}
