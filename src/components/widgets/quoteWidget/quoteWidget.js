import { WidgetContainer } from "../widget/WidgetContainer.js";
import { QuoteWidgetRenderer } from "./quoteWidgetRender.js";

class QuoteWidget {
  constructor() {
    this.quoteWidgetRenderer = new QuoteWidgetRenderer();
    this.quoteWidgetContainer = new WidgetContainer(
      this.quoteWidgetRenderer,
      "quote-widget-container",
    );

    this.quoteWidgetContainer.addToDOM("col-4");
    this.quoteWidgetContainer.renderWidgetContent();
  }
}

export { QuoteWidget };
