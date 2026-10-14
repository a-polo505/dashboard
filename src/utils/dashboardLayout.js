function copyLayout(layout) {
  return layout.map((widget) => ({
    id: widget.id,
    is_remove: widget.is_remove,
  }));
}

export function createDefaultLayout(widgetIds) {
  if (
    !Array.isArray(widgetIds) ||
    widgetIds.length === 0 ||
    [...widgetIds].some((id) => typeof id !== "string" || id.trim() === "") ||
    new Set(widgetIds).size !== widgetIds.length
  ) {
    throw new Error("Widget IDs must be unique, nonempty strings");
  }
  return widgetIds.map((id) => ({ id, is_remove: false }));
}

export function layoutsEqual(left, right) {
  return (
    left.length === right.length &&
    left.every(
      (widget, index) =>
        widget.id === right[index].id &&
        widget.is_remove === right[index].is_remove,
    )
  );
}

// Reconcile a saved layout with additions and removals in the widget catalog.
export function normalizeLayout(layout, widgetIds) {
  const defaults = createDefaultLayout(widgetIds);
  if (!Array.isArray(layout) || layout.length === 0) return null;

  const seen = new Set();
  for (const widget of layout) {
    if (
      !widget ||
      typeof widget.id !== "string" ||
      widget.id.trim() === "" ||
      typeof widget.is_remove !== "boolean" ||
      seen.has(widget.id)
    ) {
      return null;
    }
    seen.add(widget.id);
  }
  if (!layout.some((widget) => !widget.is_remove)) return null;

  const knownIds = new Set(widgetIds);
  const normalized = copyLayout(
    layout.filter((widget) => knownIds.has(widget.id)),
  );
  normalized.push(...defaults.filter((widget) => !seen.has(widget.id)));
  return normalized.some((widget) => !widget.is_remove) ? normalized : null;
}

export class DashboardLayout {
  #defaults;
  #saved;
  #draft = null;

  constructor(widgetIds, savedLayout = null) {
    this.#defaults = createDefaultLayout(widgetIds);
    this.#saved =
      normalizeLayout(savedLayout, widgetIds) ?? copyLayout(this.#defaults);
  }

  get layout() {
    return copyLayout(this.#draft ?? this.#saved);
  }

  get savedLayout() {
    return copyLayout(this.#saved);
  }

  get isEditing() {
    return this.#draft !== null;
  }

  get hasChanges() {
    return this.isEditing && !layoutsEqual(this.#draft, this.#saved);
  }

  beginEdit() {
    if (this.isEditing) return false;
    this.#draft = copyLayout(this.#saved);
    return true;
  }

  #requireEditing() {
    if (!this.isEditing) throw new Error("Layout editing is not active");
  }

  // targetIndex is the final index among visible widgets, excluding hidden ones.
  moveWidget(id, targetIndex) {
    this.#requireEditing();
    const visible = this.#draft.filter((widget) => !widget.is_remove);
    const sourceIndex = visible.findIndex((widget) => widget.id === id);
    if (
      visible.length < 2 ||
      sourceIndex < 0 ||
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= visible.length ||
      sourceIndex === targetIndex
    ) {
      return false;
    }

    const moving = visible[sourceIndex];
    this.#draft.splice(this.#draft.indexOf(moving), 1);
    const remaining = this.#draft.filter((widget) => !widget.is_remove);
    const insertionIndex =
      targetIndex < remaining.length
        ? this.#draft.indexOf(remaining[targetIndex])
        : this.#draft.indexOf(remaining[remaining.length - 1]) + 1;
    this.#draft.splice(insertionIndex, 0, moving);
    return true;
  }

  hideWidget(id) {
    this.#requireEditing();
    const widget = this.#draft.find((widget) => widget.id === id);
    if (
      !widget ||
      widget.is_remove ||
      this.#draft.filter((entry) => !entry.is_remove).length === 1
    ) {
      return false;
    }
    widget.is_remove = true;
    return true;
  }

  restoreWidget(id) {
    this.#requireEditing();
    const widget = this.#draft.find((widget) => widget.id === id);
    if (!widget || !widget.is_remove) return false;
    widget.is_remove = false;
    return true;
  }

  reset() {
    this.#requireEditing();
    const changed = !layoutsEqual(this.#draft, this.#defaults);
    this.#draft = copyLayout(this.#defaults);
    return changed;
  }

  cancel() {
    if (!this.isEditing) return false;
    this.#draft = null;
    return true;
  }

  // Persistence is synchronous (localStorage); only true confirms success.
  save(persist) {
    this.#requireEditing();
    if (this.hasChanges) {
      try {
        if (persist(this.layout) !== true) return false;
      } catch {
        return false;
      }
    }
    this.#saved = copyLayout(this.#draft);
    this.#draft = null;
    return true;
  }
}
