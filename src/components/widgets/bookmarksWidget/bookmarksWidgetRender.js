class BookmarksWidgetRenderer {
  constructor(bookmarks) {
    this.bookmarks = bookmarks;
  }

  render() {
    const container = this.createContainer();
    const header = this.createHeader();
    const linksBox = this.createLinksBox();
    const totalSavedElement = this.createTotalSavedElement();

    container.appendChild(header);
    container.appendChild(linksBox);
    container.appendChild(totalSavedElement);

    this.updateTotalSaved(totalSavedElement, linksBox);

    return container;
  }

  createContainer() {
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "h-100",
      "wraper",
    );
    return container;
  }

  createHeader() {
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("flex", "w-100", "gap-8", "align-center", "header");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "10");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 14 20");
    svg.setAttribute("fill", "none");
    svg.classList.add("widget-icon");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M1.99902 19.3223C2.47363 19.3223 2.78125 19.0762 3.52832 18.3467L6.9209 14.9893C6.95605 14.9453 7.03516 14.9453 7.07031 14.9893L10.4717 18.3467C11.2188 19.0762 11.5176 19.3223 12.001 19.3223C12.7041 19.3223 13.1436 18.8389 13.1436 18.0479V2.70215C13.1436 0.953125 12.2295 0.0302734 10.498 0.0302734H3.49316C1.76172 0.0302734 0.847656 0.953125 0.847656 2.70215V18.0479C0.847656 18.8389 1.28711 19.3223 1.99902 19.3223Z",
    );
    path.setAttribute("fill", "#114DB3");
    svg.appendChild(path);

    const title = document.createElement("p");
    title.classList.add("title");
    title.textContent = "Bookmarks";

    headerDiv.appendChild(svg);
    headerDiv.appendChild(title);

    return headerDiv;
  }

  createLinksBox() {
    const linksBox = document.createElement("div");
    linksBox.classList.add("flex", "links-box");

    linksBox.addEventListener("wheel", (event) => {
      if (event.deltaY !== 0) {
        event.preventDefault();
        linksBox.scrollLeft += event.deltaY;
      }
    });

    this.bookmarks.forEach((bookmark) => {
      const linkElement = this.createLinkElement(bookmark);
      linksBox.appendChild(linkElement);
    });

    return linksBox;
  }

  createLinkElement(bookmark) {
    const link = document.createElement("a");
    link.href = bookmark.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
    link.referrerPolicy = "origin";
    link.classList.add("icon-link");

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("flex", "flex-col", "gap-2", "align-center");

    const linkBox = document.createElement("div");
    linkBox.classList.add("bookmarks-link-box", bookmark.className);
    linkBox.innerHTML = bookmark.svgIcon;

    const linkText = document.createElement("p");
    linkText.classList.add("bookmarks-link-text");
    linkText.textContent = bookmark.text;

    contentDiv.appendChild(linkBox);
    contentDiv.appendChild(linkText);
    link.appendChild(contentDiv);

    return link;
  }

  createTotalSavedElement() {
    const totalSavedElement = document.createElement("p");
    totalSavedElement.id = "total-saved";
    totalSavedElement.classList.add("link-total");
    return totalSavedElement;
  }

  updateTotalSaved(totalSavedElement, linksBox) {
    const linkBoxes = linksBox.querySelectorAll(".bookmarks-link-box");
    totalSavedElement.textContent = `Total bookmarks: ${linkBoxes.length}`;
  }
}

export { BookmarksWidgetRenderer };
