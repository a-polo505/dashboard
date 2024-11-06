import { WidgetContainer } from "../widget/WidgetContainer.js";
import { BookmarksWidgetRenderer } from "./bookmarksWidgetRender.js";
import { bookmarks } from "./bookmarks.js";

class BookmarksWidget {
  constructor() {
    this.bookmarkWidgetRenderer = new BookmarksWidgetRenderer(bookmarks);
    this.bookmarksWidgetContainer = new WidgetContainer(
      this.bookmarkWidgetRenderer,
      "bookmarks-widget-container",
    );

    this.bookmarksWidgetContainer.addToDOM("widgets");
    this.bookmarksWidgetContainer.renderWidgetContent();
  }
}

export { BookmarksWidget };
