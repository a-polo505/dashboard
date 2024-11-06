// class QuoteWidgetRenderer {
//   render() {
//     const container = document.createElement("div");
//     container.classList.add(
//       "flex",
//       "flex-col",
//       "justify-end",
//       "h-100",
//       "wraper",
//     );

//     const containerContent = `
//             <div class="quote-widget-container--symbol">”</div>
//             <div class="quote-widget-container--text"><span class="quote-widget-container--text-accent">Keep it simple</span>, brilliance lies in&nbspease</div>
//         `;

//     container.innerHTML = containerContent;
//     return container;
//   }
// }

// export { QuoteWidgetRenderer };

class QuoteWidgetRenderer {
  constructor(quote) {
    this.quote = quote;
  }

  render() {
    const container = this.createContainer();
    const symbolElement = this.createSymbolElement();
    const textElement = this.createTextElement();

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
