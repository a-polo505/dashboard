import { WidgetContainer } from "../widget/WidgetContainer.js";
import { ContactAuthorWidgetRenderer } from "./contactAuthorWidgetRender.js";

class ContactAuthorWidget {
  constructor() {
    this.contactAuthorRenderer = new ContactAuthorWidgetRenderer();
    this.contactAuthorWidgetContainer = new WidgetContainer(
      this.contactAuthorRenderer,
      "contact-author-widget-container",
    );

    this.contactAuthorWidgetContainer.addToDOM("widgets");
    this.contactAuthorWidgetContainer.renderWidgetContent();
  }
}

export { ContactAuthorWidget };
