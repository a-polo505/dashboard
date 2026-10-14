import {
  containCard,
  edgeScrollSpeed,
  nearestSlot,
} from "./gridDragGeometry.js";

const DRAG_THRESHOLD = 5;
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Pointer preview is temporary DOM order. Only a completed drop changes the
// editor draft; cancellation restores its exact order, including hidden items.
export function initializeGridDrag({ grid, onStart, onDrop, onCancel }) {
  const motion = window.matchMedia(MOTION_QUERY);
  const animations = new Map();
  let gesture = null;
  let frame = null;
  let lastTime = null;
  let suppressClick = false;

  const items = () =>
    [...grid.children].filter(
      (node) => node.classList.contains("grid-widget") && !node.hidden,
    );

  function layoutRect(node) {
    const parent = grid.getBoundingClientRect();
    return {
      left: parent.left + grid.clientLeft + node.offsetLeft - grid.scrollLeft,
      top: parent.top + grid.clientTop + node.offsetTop - grid.scrollTop,
      width: node.offsetWidth,
      height: node.offsetHeight,
    };
  }

  function stopAnimations() {
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
  }

  function animateOffset(node, x, y) {
    animations.get(node)?.cancel();
    if (motion.matches || typeof node.animate !== "function" || (!x && !y))
      return;
    const animation = node.animate(
      [
        { transform: `translate(${x}px, ${y}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: 180, easing: "ease-out" },
    );
    animations.set(node, animation);
    animation.onfinish = animation.oncancel = () => {
      if (animations.get(node) === animation) animations.delete(node);
    };
  }

  function rearrange(change, active, animate = true) {
    const before = new Map(
      items().map((node) => [node, node.getBoundingClientRect()]),
    );
    stopAnimations();
    change();
    if (!animate) return;
    for (const node of items()) {
      if (node === active || !before.has(node)) continue;
      const after = layoutRect(node);
      const previous = before.get(node);
      animateOffset(node, previous.left - after.left, previous.top - after.top);
    }
  }

  function updatePosition() {
    if (!gesture?.active) return;
    const { shell, surface, pointer, offset, size } = gesture;
    const nodes = items();
    const slots = nodes.map(layoutRect);
    const bounds = {
      left: Math.min(...slots.map((slot) => slot.left)),
      top: Math.min(...slots.map((slot) => slot.top)),
      right: Math.max(...slots.map((slot) => slot.left + slot.width)),
      bottom: Math.max(...slots.map((slot) => slot.top + slot.height)),
    };
    const position = containCard(pointer, offset, size, bounds);
    const target = nearestSlot(position, size, slots);
    if (target !== nodes.indexOf(shell)) {
      rearrange(() => {
        const remaining = nodes.filter((node) => node !== shell);
        const reference =
          remaining[target] ?? remaining[remaining.length - 1].nextSibling;
        grid.insertBefore(shell, reference);
      }, shell);
    }
    const slot = layoutRect(shell);
    surface.style.transform = `translate(${position.left - slot.left}px, ${position.top - slot.top}px)`;
  }

  function scheduleFrame() {
    if (frame !== null || !gesture?.active) return;
    frame = window.requestAnimationFrame(tick);
  }

  function tick(time) {
    frame = null;
    if (!gesture?.active) return;
    const elapsed = lastTime === null ? 16 : Math.min(32, time - lastTime);
    lastTime = time;
    const bounds = grid.getBoundingClientRect();
    const { pointer } = gesture;
    const requestedSpeed =
      pointer.x >= bounds.left && pointer.x <= bounds.right
        ? edgeScrollSpeed(pointer, window.innerHeight)
        : 0;
    const speed =
      (requestedSpeed < 0 && bounds.top < 0) ||
      (requestedSpeed > 0 && bounds.bottom > window.innerHeight)
        ? requestedSpeed
        : 0;
    const previousScroll = window.scrollY;
    if (speed) window.scrollBy(0, (speed * elapsed) / 1000);
    updatePosition();
    if (speed && window.scrollY !== previousScroll) scheduleFrame();
    else lastTime = null;
  }

  function finish(cancelled, animate = true) {
    if (!gesture) return false;
    const { shell, surface, pointerId, active } = gesture;
    const visual = active ? surface.getBoundingClientRect() : null;
    const target = items().indexOf(shell);
    gesture = null;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = lastTime = null;
    // Clear state before releasing capture: lostpointercapture also calls cancel.
    if (grid.hasPointerCapture?.(pointerId))
      grid.releasePointerCapture(pointerId);
    grid.classList.remove("grid--dragging");
    shell.classList.remove("grid-widget--dragging");
    surface.style.removeProperty("transform");
    if (active) {
      suppressClick = true;
      rearrange(
        () => (cancelled ? onCancel() : onDrop(shell.dataset.widgetId, target)),
        shell,
        animate,
      );
      if (animate) {
        const slot = layoutRect(shell);
        animateOffset(surface, visual.left - slot.left, visual.top - slot.top);
      }
    }
    return active;
  }

  function cancel() {
    finish(true, false);
    stopAnimations();
  }

  function onPointerDown(event) {
    if (!gesture) suppressClick = false;
    if (
      gesture ||
      event.button !== 0 ||
      event.pointerType !== "mouse" ||
      event.isPrimary === false ||
      event.target.closest("button, a, input, select, textarea")
    )
      return;
    const shell = event.target.closest(".grid-widget");
    if (!shell || shell.parentElement !== grid || items().length < 2) return;
    stopAnimations();
    const size = layoutRect(shell);
    if (!size.width || !size.height) return;
    try {
      // The grid stays mounted while its child cards move between slots.
      grid.setPointerCapture(event.pointerId);
    } catch {
      return;
    }
    event.preventDefault();
    gesture = {
      shell,
      surface: shell.querySelector(".grid-widget__surface"),
      pointerId: event.pointerId,
      pointer: { x: event.clientX, y: event.clientY },
      start: { x: event.clientX, y: event.clientY },
      offset: { x: event.clientX - size.left, y: event.clientY - size.top },
      size,
      active: false,
    };
  }

  function onPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (event.buttons === 0) {
      cancel();
      return;
    }
    gesture.pointer = { x: event.clientX, y: event.clientY };
    if (!gesture.active) {
      if (
        Math.hypot(
          event.clientX - gesture.start.x,
          event.clientY - gesture.start.y,
        ) < DRAG_THRESHOLD
      )
        return;
      gesture.active = true;
      grid.classList.add("grid--dragging");
      gesture.shell.classList.add("grid-widget--dragging");
      onStart();
    }
    event.preventDefault();
    scheduleFrame();
  }

  function onPointerUp(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.pointer = { x: event.clientX, y: event.clientY };
    updatePosition();
    finish(false);
  }

  function onPointerCancel(event) {
    if (gesture?.pointerId === event.pointerId) cancel();
  }

  function onKeydown(event) {
    if (event.key === "Escape" && gesture) {
      event.preventDefault();
      finish(true);
    }
  }

  function onClick(event) {
    if (!suppressClick || !event.detail) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function onMotionChange() {
    if (motion.matches) stopAnimations();
  }

  const gridListeners = {
    pointerdown: onPointerDown,
    pointermove: onPointerMove,
    pointerup: onPointerUp,
    pointercancel: onPointerCancel,
    lostpointercapture: onPointerCancel,
  };
  for (const [type, listener] of Object.entries(gridListeners))
    grid.addEventListener(type, listener);
  grid.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKeydown);
  window.addEventListener("blur", cancel);
  window.addEventListener("resize", cancel);
  window.addEventListener("scroll", scheduleFrame, { passive: true });
  motion.addEventListener("change", onMotionChange);

  return {
    cancel,
    destroy() {
      cancel();
      for (const [type, listener] of Object.entries(gridListeners))
        grid.removeEventListener(type, listener);
      grid.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeydown);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("scroll", scheduleFrame);
      motion.removeEventListener("change", onMotionChange);
    },
  };
}
