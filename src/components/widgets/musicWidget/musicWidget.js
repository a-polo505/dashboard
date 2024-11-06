import { WidgetContainer } from "../widget/WidgetContainer.js";
import { MusicWidgetRenderer } from "./musicWidgetRender.js";

class MusicWidget {
  constructor() {
    this.musicWidgetRenderer = new MusicWidgetRenderer();
    this.musicWidgetContainer = new WidgetContainer(
      this.musicWidgetRenderer,
      "music-widget-container",
    );

    this.musicWidgetContainer.addToDOM("widgets");
    this.musicWidgetContainer.renderWidgetContent();
  }
}

export { MusicWidget };
