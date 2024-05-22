import { BaseButton } from "./BaseButton.js";

class IconButton extends BaseButton {
  constructor(label, onClick, icon, iconPosition = "left", styles = {}) {
    super(label, onClick, styles);
    this.icon = icon;
    this.iconPosition = iconPosition;
    this.buttonElement = this.createButtonElement();
  }

  createButtonElement() {
    const button = super.createButtonElement();
    const iconElement = document.createElement("span");
    iconElement.classList.add("icon");
    iconElement.innerHTML = this.icon;

    if (this.iconPosition === "left") {
      button.insertBefore(iconElement, button.firstChild);
    } else {
      button.appendChild(iconElement);
    }

    return button;
  }
}

export { IconButton };
