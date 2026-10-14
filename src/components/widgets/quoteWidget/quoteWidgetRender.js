class QuoteWidgetRenderer {
  constructor(quote) {
    this.quote = quote;
  }

  render() {
    const container = this.createContainer();
    const patternElement = document.createElement("div");
    patternElement.classList.add("quote-widget-container--pattern");
    patternElement.setAttribute("aria-hidden", "true");
    const symbolElement = this.createSymbolElement();
    const textElement = this.createTextElement();

    container.appendChild(patternElement);
    container.appendChild(symbolElement);
    container.appendChild(textElement);

    return container;
  }

  createContainer() {
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-end",
      "h-100",
      "wraper",
    );
    return container;
  }

  createSymbolElement() {
    const symbolDiv = document.createElement("div");
    symbolDiv.classList.add("quote-widget-container--symbol");
    symbolDiv.textContent = "”";
    return symbolDiv;
  }

  createTextElement() {
    const textDiv = document.createElement("div");
    textDiv.classList.add("quote-widget-container--text");

    const accentSpan = document.createElement("span");
    accentSpan.classList.add("quote-widget-container--text-accent");
    accentSpan.textContent = this.quote.highlightedText;

    textDiv.appendChild(accentSpan);

    const textNode = document.createTextNode(`, ${this.quote.remainingText}`);
    textDiv.appendChild(textNode);

    return textDiv;
  }
}

export { QuoteWidgetRenderer };
