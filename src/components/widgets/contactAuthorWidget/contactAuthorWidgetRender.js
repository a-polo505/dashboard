import { BaseButton } from "../../ui/button/BaseButton.js";
import { ButtonStyle } from "../../ui/button/ButtonStyle.js";

class ContactAuthorWidgetRenderer {
  constructor() {
    this.links = {
      twitter: "https://x.com/a_polo505",
      bluesky: "https://bsky.app/profile/apolo505.bsky.social",
      github: "https://github.com/a-polo505",
    };

    this.buttonTwitter = this.createButton("btn-twitter", this.links.twitter);
    this.buttonBlueSky = this.createButton("btn-bluesky", this.links.bluesky);
  }

  render() {
    const container = this.createContainer();
    const buttonContainer = this.createButtonsContainer();
    const logoContainer = this.createLogoContainer();
    const textContainer = this.createTextContainer();

    container.appendChild(logoContainer);
    container.appendChild(textContainer);
    container.appendChild(buttonContainer);

    return container;
  }

  createContainer() {
    return this.createElement("div", [
      "flex",
      "flex-col",
      "justify-center",
      "h-100",
      "wraper",
    ]);
  }

  createButtonsContainer() {
    const buttonsContainer = this.createElement("div", [
      "flex",
      "align-end",
      "w-100",
      "justify-between",
      "button-container",
    ]);

    const buttonTwitter = this.buttonTwitter.render();
    buttonTwitter.classList.add("button", "btn-twitter");

    const buttonBlueSky = this.buttonBlueSky.render();
    buttonBlueSky.classList.add("button", "btn-bluesky");

    buttonsContainer.appendChild(buttonTwitter);
    buttonsContainer.appendChild(buttonBlueSky);

    return buttonsContainer;
  }

  createLogoContainer() {
    const logoContainer = this.createElement("div", [
      "flex",
      "w-100",
      "justify-start",
      "logo-container",
    ]);

    const avatarLink = this.createElement("a", ["avatar"], {
      href: this.links.github,
      "aria-label": "a-polo505 avatar",
      target: "_blank",
    });

    logoContainer.appendChild(avatarLink);
    return logoContainer;
  }

  createTextContainer() {
    const textContainer = this.createElement("div", [
      "flex-col",
      "h-100",
      "w-100",
      "text-container",
    ]);

    const textPrimaryElement = this.createElement("p", ["primary-text"], {
      textContent: "Let’s stay in touch!",
    });

    const textSecondaryElement = this.createElement("p", ["secondary-text"], {
      textContent: "X and BlueSky profiles",
    });

    textContainer.appendChild(textPrimaryElement);
    textContainer.appendChild(textSecondaryElement);

    return textContainer;
  }

  createButton(buttonClass, url) {
    return new BaseButton(
      null,
      () => this.openLink(url),
      ButtonStyle.default(),
      buttonClass,
    );
  }

  openLink(url) {
    window.open(url, "_blank");
  }

  createElement(tag, classList = [], attributes = {}) {
    const element = document.createElement(tag);
    if (classList.length) element.classList.add(...classList);

    Object.keys(attributes).forEach((attr) => {
      if (attr === "textContent") {
        element.textContent = attributes[attr];
      } else {
        element.setAttribute(attr, attributes[attr]);
      }
    });

    return element;
  }
}

export { ContactAuthorWidgetRenderer };
