import { WidgetContainer } from "../widget/WidgetContainer.js";
import { QuoteWidgetRenderer } from "./quoteWidgetRender.js";
import { quote } from "./quote.js";

class QuoteWidget {
  constructor() {
    this.quoteWidgetRenderer = new QuoteWidgetRenderer(quote);
    this.quoteWidgetContainer = new WidgetContainer(
      this.quoteWidgetRenderer,
      "quote-widget-container",
    );

    this.quoteWidgetContainer.addToDOM("widgets");
    this.quoteWidgetContainer.renderWidgetContent();
  }
}

export { QuoteWidget };
