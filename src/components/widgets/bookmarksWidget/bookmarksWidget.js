import { WidgetContainer } from "../widget/WidgetContainer.js";
import { BookmarksWidgetRenderer } from "./bookmarksWidgetRender.js";

class BookmarksWidget {
  constructor() {
    this.bookmarkWidgetRenderer = new BookmarksWidgetRenderer();
    this.bookmarksWidgetContainer = new WidgetContainer(
      this.bookmarkWidgetRenderer,
      "bookmarks-widget-container",
    );

    this.bookmarksWidgetContainer.addToDOM("widgets");
    this.bookmarksWidgetContainer.renderWidgetContent();
  }
}

export { BookmarksWidget };
