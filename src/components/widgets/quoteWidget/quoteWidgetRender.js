class QuoteWidgetRenderer {
  constructor(quote, { onPrevious, onNext }) {
    this.quote = quote;
    this.onPrevious = onPrevious;
    this.onNext = onNext;
  }

  render() {
    const container = this.createContainer();
    const patternElement = document.createElement("div");
    patternElement.classList.add("quote-widget-container--pattern");
    patternElement.setAttribute("aria-hidden", "true");
    const symbolElement = this.createSymbolElement();
    const textElement = this.createTextElement();

    container.appendChild(patternElement);
    container.appendChild(this.createNavigation());
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
    symbolDiv.setAttribute("aria-hidden", "true");
    symbolDiv.textContent = "”";
    return symbolDiv;
  }

  createTextElement() {
    this.textElement = document.createElement("div");
    this.textElement.classList.add("quote-widget-container--text");
    this.textElement.setAttribute("aria-live", "polite");
    this.textElement.setAttribute("aria-atomic", "true");
    this.updateQuote(this.quote);
    return this.textElement;
  }

  updateQuote(quote) {
    this.quote = quote;
    const lines = quote.lines.map(({ highlightedText, text = "" }) => {
      const line = document.createElement("div");
      line.classList.add("quote-widget-container--line");
      if (highlightedText) {
        const accentSpan = document.createElement("span");
        accentSpan.classList.add("quote-widget-container--text-accent");
        accentSpan.textContent = highlightedText;
        line.appendChild(accentSpan);
      }
      line.appendChild(document.createTextNode(text));
      return line;
    });
    this.textElement.replaceChildren(...lines);
  }

  createNavigation() {
    const navigation = document.createElement("div");
    navigation.classList.add("quote-widget-container--navigation");
    navigation.setAttribute("role", "group");
    navigation.setAttribute("aria-label", "Quote navigation");
    navigation.append(
      this.createNavigationButton(
        "Previous quote",
        "previous",
        this.onPrevious,
      ),
      this.createNavigationButton("Next quote", "next", this.onNext),
    );
    return navigation;
  }

  createNavigationButton(label, direction, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add(
      "quote-widget-container--navigation-button",
      `quote-widget-container--navigation-${direction}`,
    );
    button.setAttribute("aria-label", label);
    button.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M7.87688 10.5449L7.47937 10.1474L3.86437 6.53242C3.79408 6.4627 3.73828 6.37975 3.70021 6.28836C3.66213 6.19696 3.64253 6.09893 3.64253 5.99992C3.64253 5.90091 3.66213 5.80288 3.70021 5.71149C3.73828 5.6201 3.79408 5.53715 3.86438 5.46742L7.47938 1.85242L7.87688 1.45492L8.67188 2.24992L8.27438 2.64742L4.92188 5.99992L8.27438 9.35242L8.67188 9.74992L7.87688 10.5449Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/></svg>`;
    button.addEventListener("click", onClick);

    return button;
  }
}

export { QuoteWidgetRenderer };
