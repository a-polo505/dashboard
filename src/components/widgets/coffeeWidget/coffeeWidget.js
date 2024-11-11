import { WidgetContainer } from "../widget/WidgetContainer.js";
import { CoffeeWidgetRenderer } from "./coffeeWidgetRender.js";

class CoffeeWidget {
  constructor() {
    this.coffeeWidgetRenderer = new CoffeeWidgetRenderer();
    this.coffeeWidgetContainer = new WidgetContainer(
      this.coffeeWidgetRenderer,
      "coffe-widget-container",
    );

    this.coffeeWidgetContainer.addToDOM("widgets");
    this.coffeeWidgetContainer.renderWidgetContent();
  }
}

export { CoffeeWidget };
