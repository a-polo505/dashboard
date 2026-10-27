/** @jest-environment jsdom */

import { ClockWidget } from "../src/components/widgets/clockWidget/clockWidget.js";

describe("live local clock lifecycle", () => {
  const originalObserver = Object.getOwnPropertyDescriptor(
    window,
    "IntersectionObserver",
  );
  const originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");
  let frames;
  let observer;
  let clock;
  let nextFrame;

  function setVisibility(hidden) {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: hidden,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }

  function intersect(isIntersecting) {
    observer.callback([
      { target: clock.clockWidgetContainer.container, isIntersecting },
    ]);
  }

  function runFrame() {
    const [id, onFrame] = [...frames][0];
    frames.delete(id);
    onFrame(999999);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 26, 9, 38, 15, 500));
    document.body.innerHTML = '<div class="widgets"></div>';
    setVisibility(false);
    frames = new Map();
    nextFrame = 0;
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      });
    jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id) => frames.delete(id));
    window.IntersectionObserver = jest.fn((callback) => {
      observer = { callback, observe: jest.fn(), disconnect: jest.fn() };
      return observer;
    });
    clock = new ClockWidget();
  });

  afterEach(() => {
    clock.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    if (originalObserver)
      Object.defineProperty(window, "IntersectionObserver", originalObserver);
    else delete window.IntersectionObserver;
    if (originalHidden)
      Object.defineProperty(document, "hidden", originalHidden);
    else delete document.hidden;
  });

  test("mounts once with the current local time and waits until visible to animate", () => {
    expect(document.querySelectorAll(".clock-widget-container")).toHaveLength(
      1,
    );
    expect(document.querySelector(".clock").getAttribute("aria-label")).toBe(
      "Local time: 09:38:15",
    );
    expect(observer.observe).toHaveBeenCalledWith(
      clock.clockWidgetContainer.container,
    );
    expect(frames.size).toBe(0);
    intersect(true);
    intersect(true);
    expect(frames.size).toBe(1);
  });

  test("uses wall-clock time on each frame instead of accumulating elapsed frames", () => {
    intersect(true);
    const face = document.querySelector(".clock__face");
    jest.setSystemTime(new Date(2026, 9, 26, 18, 0, 0, 250));
    runFrame();
    expect(
      document.querySelector(".clock__second").getAttribute("transform"),
    ).toBe("rotate(1.5)");
    expect(document.querySelector(".clock").getAttribute("aria-label")).toBe(
      "Local time: 18:00:00",
    );
    expect(document.querySelector(".clock__face")).toBe(face);
    expect(frames.size).toBe(1);
  });

  test("pauses out of view, including grid hiding, and immediately resynchronizes on return", () => {
    intersect(true);
    clock.clockWidgetContainer.container.hidden = true;
    intersect(false);
    expect(frames.size).toBe(0);
    jest.setSystemTime(new Date(2026, 9, 27, 0, 0, 0));
    clock.clockWidgetContainer.container.hidden = false;
    intersect(true);
    expect(
      document.querySelector(".clock__second").getAttribute("transform"),
    ).toBe("rotate(0)");
    expect(document.querySelector(".clock").getAttribute("aria-label")).toBe(
      "Local time: 00:00:00",
    );
    expect(frames.size).toBe(1);
  });

  test("keeps a hidden tab stopped even when the viewport observer reports visible", () => {
    intersect(true);
    setVisibility(true);
    expect(frames.size).toBe(0);
    intersect(true);
    expect(frames.size).toBe(0);
    jest.setSystemTime(new Date(2026, 9, 26, 10, 0, 1));
    setVisibility(false);
    expect(frames.size).toBe(1);
    expect(document.querySelector(".clock").getAttribute("aria-label")).toBe(
      "Local time: 10:00:01",
    );
  });

  test("destroy cancels frames and subscriptions and prevents observer callbacks restarting it", () => {
    intersect(true);
    clock.destroy();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    intersect(true);
    setVisibility(false);
    expect(frames.size).toBe(0);
  });

  test("still runs when IntersectionObserver is unavailable", () => {
    clock.destroy();
    delete window.IntersectionObserver;
    clock = new ClockWidget();
    expect(frames.size).toBe(1);
    setVisibility(true);
    expect(frames.size).toBe(0);
  });
});
