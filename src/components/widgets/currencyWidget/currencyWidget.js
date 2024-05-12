import { WidgetContainer } from "../widget/WidgetContainer.js";
import { CurrencyWidgetRenderer } from "../../../utils/currencyWidgetRender.js";
import { Spinner } from "../../ui/spinner/spinnerManager.js";

class CurrencyWidget {
  constructor() {
    this.spinner = new Spinner();
    this.spinner.addToDOM("currencyWidget");

    this.currencyWidgetRenderer = new CurrencyWidgetRenderer();
    this.currencyWidgetContainer = new WidgetContainer(
      this.currencyWidgetRenderer,
      "currency-widget-container",
    );

    this.currencyWidgetContainer.addToDOM("currencyWidget");
    this.currencyWidgetContainer.renderWidgetContent();
  }
}

export { CurrencyWidget };
