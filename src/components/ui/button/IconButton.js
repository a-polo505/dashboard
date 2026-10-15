class IconButton {
  constructor({ id, label, icon, onClick, disabled = false, classNames = [] }) {
    const button = document.createElement("button");
    button.type = "button";
    if (id) button.id = id;
    button.classList.add("primary-btn", "icon-button", ...classNames);
    button.disabled = disabled;

    const decorativeIcon = icon.cloneNode(true);
    decorativeIcon.classList.add("icon-button__icon");
    decorativeIcon.setAttribute("width", "16");
    decorativeIcon.setAttribute("height", "16");
    decorativeIcon.setAttribute("aria-hidden", "true");
    decorativeIcon.setAttribute("focusable", "false");
    const text = document.createElement("span");
    text.textContent = label;
    button.append(decorativeIcon, text);

    if (onClick) {
      button.addEventListener("click", (event) => {
        if (!button.disabled) onClick(event);
      });
    }
    this.buttonElement = button;
  }

  render() {
    return this.buttonElement;
  }
}

export { IconButton };
