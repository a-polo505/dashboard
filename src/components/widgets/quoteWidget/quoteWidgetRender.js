class QuoteWidgetRenderer {
  render() {
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-end",
      "h-100",
      "wraper",
    );

    const containerContent = `
            <div class="quote-widget-container--symbol">”</div>
            <div class="quote-widget-container--text"><span class="quote-widget-container--text-accent">Keep it simple</span>, brilliance lies in&nbspease</div>
        `;

    container.innerHTML = containerContent;
    return container;
  }
}

export { QuoteWidgetRenderer };
