/** @jest-environment jsdom */

import { BookmarksWidgetRenderer } from "../src/components/widgets/bookmarksWidget/bookmarksWidgetRender.js";
import { bookmarks } from "../src/components/widgets/bookmarksWidget/bookmarks.js";

describe("bookmark wheel scrolling", () => {
  let linksBox;
  let scrollWidth;
  let clientWidth;

  function wheel(deltaY, options = {}) {
    const event = new window.WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY,
      ...options,
    });
    linksBox.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    document.body.replaceChildren(
      new BookmarksWidgetRenderer(bookmarks).render(),
    );
    linksBox = document.querySelector(".links-box");
    scrollWidth = 800;
    clientWidth = 300;
    // jsdom has no layout engine; supply the real browser's geometry inputs.
    Object.defineProperties(linksBox, {
      scrollWidth: { get: () => scrollWidth },
      clientWidth: { get: () => clientWidth },
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  test.each([
    [0, -20],
    [500, 20],
    [-25, -20],
    [525, 20],
    [0.5, -20],
    [499.5, 20],
    [1, -20],
    [499, 20],
  ])(
    "allows page scrolling at position %s with delta %s",
    (position, delta) => {
      linksBox.scrollLeft = position;

      expect(wheel(delta).defaultPrevented).toBe(false);
      expect(linksBox.scrollLeft).toBe(position);
    },
  );

  test.each([
    [0, 20, 20],
    [500, -20, 480],
    [250, 20, 270],
    [250, -20, 230],
    [498.5, 20, 500],
    [1.5, -20, 0],
    [-25, 20, 20],
    [525, -20, 480],
    [250.5, 0.25, 250.75],
    [250, 800, 500],
    [250, -800, 0],
  ])(
    "scrolls horizontally from %s with delta %s to %s",
    (position, delta, expected) => {
      linksBox.scrollLeft = position;

      expect(wheel(delta).defaultPrevented).toBe(true);
      expect(linksBox.scrollLeft).toBe(expected);
    },
  );

  test.each([200, 300])(
    "allows page scrolling without overflow (%s px)",
    (width) => {
      scrollWidth = width;

      expect(wheel(20).defaultPrevented).toBe(false);
      expect(wheel(-20).defaultPrevented).toBe(false);
      expect(linksBox.scrollLeft).toBe(0);
    },
  );

  test("rechecks overflow after the container is resized", () => {
    expect(wheel(20).defaultPrevented).toBe(true);
    clientWidth = 800;

    expect(wheel(20).defaultPrevented).toBe(false);
    expect(wheel(-20).defaultPrevented).toBe(false);
  });

  test.each([0, 1, 2])(
    "releases both edges for wheel deltaMode %s",
    (deltaMode) => {
      expect(wheel(-3, { deltaMode }).defaultPrevented).toBe(false);
      linksBox.scrollLeft = 500;
      expect(wheel(3, { deltaMode }).defaultPrevented).toBe(false);
    },
  );

  test.each([
    [0, {}],
    [20, { deltaX: 30 }],
    [20, { ctrlKey: true }],
    [20, { cancelable: false }],
  ])("leaves native gestures unchanged (%s, %j)", (delta, options) => {
    linksBox.scrollLeft = 250;

    expect(wheel(delta, options).defaultPrevented).toBe(false);
    expect(linksBox.scrollLeft).toBe(250);
  });

  test("does not cancel touch gestures on the list", () => {
    const event = new Event("touchmove", { bubbles: true, cancelable: true });

    linksBox.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  test("keeps links, icons, labels and the total count intact", () => {
    const links = [...linksBox.querySelectorAll("a")];
    expect(links).toHaveLength(bookmarks.length);
    links.forEach((link, index) => {
      expect(link.getAttribute("href")).toBe(bookmarks[index].href);
      expect(link.target).toBe("_blank");
      expect(link.rel).toBe("noopener noreferrer nofollow");
      expect(link.querySelector("svg")).not.toBeNull();
      expect(link.textContent.trim()).toBe(bookmarks[index].text);
    });
    expect(document.querySelector(".link-total").textContent).toBe(
      `Total bookmarks: ${bookmarks.length}`,
    );
  });
});
