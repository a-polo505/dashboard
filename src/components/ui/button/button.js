// Базовий клас кнопки
class BaseButton {
    constructor(label, onClick, styles = {}) {
      if (new.target === BaseButton) {
        throw new Error("Cannot instantiate BaseButton directly.");
      }
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
  
  // Клас для кнопки з іконкою
  class IconButton extends BaseButton {
    constructor(label, onClick, icon, iconPosition = 'left', styles = {}) {
      super(label, onClick, styles);
      this.icon = icon;
      this.iconPosition = iconPosition;
      this.buttonElement = this.createButtonElement();
    }
  
    createButtonElement() {
      const button = super.createButtonElement();
      const iconElement = document.createElement('span');
      iconElement.classList.add('icon');
      iconElement.innerHTML = this.icon;
  
      if (this.iconPosition === 'left') {
        button.insertBefore(iconElement, button.firstChild);
      } else {
        button.appendChild(iconElement);
      }
  
      return button;
    }
  }
  
  // Клас для стилів кнопки
  class ButtonStyle {
    static default() {
      return {
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: '#007BFF',
        color: '#FFF',
      };
    }
  
    static hover() {
      return {
        backgroundColor: '#0056b3',
      };
    }
  
    static active() {
      return {
        backgroundColor: '#004085',
      };
    }
  
    static focus() {
      return {
        outline: '2px solid #80bdff',
        outlineOffset: '2px',
      };
    }
  }
  
  // Використання
  const handleClick = () => {
    alert('Button clicked!');
  };
  
  const button = new BaseButton('Click Me', handleClick, ButtonStyle.default());
  document.body.appendChild(button.render());
  
  const iconButton = new IconButton('Click Me', handleClick, '🌟', 'right', ButtonStyle.default());
  document.body.appendChild(iconButton.render());
  