// BaseButton.js
class BaseButton {
    constructor(label, onClick, styles = {}) {
      this.label = label;
      this.onClick = onClick;
      this.styles = styles;
      this.buttonElement = this.createButtonElement();
    }
  
    createButtonElement() {
      const button = document.createElement('button');
      button.textContent = this.label;
      button.addEventListener('click', this.onClick);
  
      // Застосування стилів
      for (const [key, value] of Object.entries(this.styles)) {
        button.style[key] = value;
      }
  
      return button;
    }
  
    render() {
      return this.buttonElement;
    }
  }
  
  export { BaseButton };
  