const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));

export function containCard(pointer, offset, size, bounds) {
  return {
    left: clamp(pointer.x - offset.x, bounds.left, bounds.right - size.width),
    top: clamp(pointer.y - offset.y, bounds.top, bounds.bottom - size.height),
  };
}

// Use layout slots, not animated card positions, to avoid oscillating targets.
export function nearestSlot(position, size, slots) {
  const x = position.left + size.width / 2;
  const y = position.top + size.height / 2;
  let nearest = 0;
  let distance = Infinity;
  for (const [index, slot] of slots.entries()) {
    const candidate =
      (x - slot.left - slot.width / 2) ** 2 +
      (y - slot.top - slot.height / 2) ** 2;
    if (candidate < distance) {
      nearest = index;
      distance = candidate;
    }
  }
  return nearest;
}

export function edgeScrollSpeed(pointer, viewportHeight) {
  const edge = Math.min(64, viewportHeight / 4);
  if (pointer.y < edge) return -600 * clamp((edge - pointer.y) / edge, 0, 1);
  if (pointer.y > viewportHeight - edge)
    return 600 * clamp((pointer.y - viewportHeight + edge) / edge, 0, 1);
  return 0;
}
