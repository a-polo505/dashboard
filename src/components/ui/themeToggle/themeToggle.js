const initializedButtons = new WeakSet();

export function initializeThemeToggle(button, root = document.documentElement) {
  if (!button || initializedButtons.has(button)) return;

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    root.dataset.theme = theme;
    button.setAttribute("aria-pressed", String(isDark));
    button.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  };

  applyTheme(root.dataset.theme === "dark" ? "dark" : "light");
  button.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
  initializedButtons.add(button);
}
