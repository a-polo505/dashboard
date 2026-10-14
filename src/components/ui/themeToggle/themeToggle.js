import {
  readThemePreference,
  saveThemePreference,
} from "../../../utils/themePreferenceStorage.js";

const initializedButtons = new WeakSet();

export function initializeThemeToggle(button, root = document.documentElement) {
  if (!button || initializedButtons.has(button)) return;

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    root.dataset.theme = theme;
    button.setAttribute("aria-pressed", String(isDark));
    button.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  };

  applyTheme(readThemePreference());
  button.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    saveThemePreference(theme);
  });
  initializedButtons.add(button);
}
