import { WidgetContainer } from "../widget/WidgetContainer.js";
import { QuoteWidgetRenderer } from "./quoteWidgetRender.js";
import { quotes } from "./quote.js";

class QuoteWidget {
  constructor() {
    this.currentIndex = 0;
    this.quoteWidgetRenderer = new QuoteWidgetRenderer(quotes[0], {
      onPrevious: () => this.changeQuote(-1),
      onNext: () => this.changeQuote(1),
    });
    this.quoteWidgetContainer = new WidgetContainer(
      this.quoteWidgetRenderer,
      "quote-widget-container",
    );

    this.quoteWidgetContainer.addToDOM("widgets");
    this.quoteWidgetContainer.renderWidgetContent();
  }

  changeQuote(direction) {
    this.currentIndex =
      (this.currentIndex + direction + quotes.length) % quotes.length;
    this.quoteWidgetRenderer.updateQuote(quotes[this.currentIndex]);
  }
}

export { QuoteWidget };
