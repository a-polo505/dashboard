const THEME_KEY = "theme";

export function readThemePreference() {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === "dark") return "dark";
    if (theme !== null) localStorage.removeItem(THEME_KEY);
  } catch {
    // Use the default theme even if a saved preference cannot be read or removed.
  }
  return "light";
}

export function saveThemePreference(theme) {
  try {
    if (theme === "dark") {
      localStorage.setItem(THEME_KEY, theme);
    } else {
      localStorage.removeItem(THEME_KEY);
    }
  } catch {
    // The active theme still works when persistence is unavailable.
  }
}
