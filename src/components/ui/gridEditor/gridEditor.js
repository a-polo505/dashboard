import {
  createDefaultLayout,
  DashboardLayout,
} from "../../../utils/dashboardLayout.js";
import {
  readDashboardLayout,
  saveDashboardLayout,
} from "../../../utils/dashboardLayoutStorage.js";

const initializedToolbars = new WeakMap();
const DESKTOP_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
const TOUCH_QUERY = "(any-pointer: coarse)";

function createButton(id, text) {
  const button = document.createElement("button");
  button.id = id;
  button.type = "button";
  button.className = "primary-btn grid-editor__button";
  button.textContent = text;
  return button;
}

export function initializeGridEditor(
  widgets,
  { grid, toolbar, beforeEdit = () => {} },
) {
  if (!grid || !toolbar || !widgets?.length) return null;
  if (initializedToolbars.has(toolbar)) return initializedToolbars.get(toolbar);
  if (typeof window.matchMedia !== "function") return null;

  const widgetIds = widgets.map((widget) => widget.id);
  const defaults = createDefaultLayout(widgetIds);
  const byId = new Map(widgets.map((widget) => [widget.id, widget]));
  const desktopMedia = window.matchMedia(DESKTOP_QUERY);
  const touchMedia = window.matchMedia(TOUCH_QUERY);
  const shells = new Map();
  let model = null;
  let desktop;
  let destroyed = false;

  const actions = document.createElement("div");
  actions.className = "grid-editor__actions";
  const edit = createButton("grid_edit_btn", "Налаштувати сітку");
  edit.setAttribute("aria-controls", grid.id);
  const cancel = createButton("grid_edit_cancel_btn", "Скасувати");
  const reset = createButton("grid_edit_reset_btn", "Скинути налаштування");
  const add = createButton("grid_edit_add_btn", "Додати віджет");
  const save = createButton("grid_edit_save_btn", "Зберегти");
  const addGroup = document.createElement("div");
  addGroup.className = "grid-editor__add";
  const menu = document.createElement("ul");
  menu.id = "grid_edit_add_menu";
  menu.className = "grid-editor__menu";
  menu.hidden = true;
  add.setAttribute("aria-controls", menu.id);
  add.setAttribute("aria-expanded", "false");
  addGroup.append(add, menu);
  actions.append(cancel, reset, addGroup, edit, save);
  const error = document.createElement("p");
  error.className = "grid-editor__error";
  error.setAttribute("role", "alert");
  error.hidden = true;
  toolbar.replaceChildren(actions, error);

  function closeMenu() {
    menu.hidden = true;
    add.setAttribute("aria-expanded", "false");
  }

  function removeShells() {
    for (const { container, shell, wasInert } of shells.values()) {
      container.toggleAttribute("inert", wasInert);
      shell.replaceWith(container);
    }
    shells.clear();
  }

  function applyLayout(layout) {
    for (const [index, entry] of layout.entries()) {
      const widget = byId.get(entry.id);
      const node = shells.get(entry.id)?.shell ?? widget.container;
      node.hidden = entry.is_remove;
      if (grid.children[index] !== node) {
        grid.insertBefore(node, grid.children[index] ?? null);
      }
    }
  }

  function render() {
    const editing = desktop && model.isEditing;
    const layout = desktop ? model.layout : defaults;
    applyLayout(layout);
    toolbar.hidden = !desktop;
    edit.hidden = editing;
    cancel.hidden = !editing;
    reset.hidden = !editing;
    addGroup.hidden = !editing;
    save.hidden = !editing;
    const removed = layout.filter((widget) => widget.is_remove);
    add.disabled = removed.length === 0;
    const visibleCount = layout.length - removed.length;
    for (const { remove } of shells.values())
      remove.hidden = visibleCount === 1;
    menu.replaceChildren();
    for (const entry of removed) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = byId.get(entry.id).name;
      button.addEventListener("click", () => {
        if (!desktop || !model.isEditing) return;
        model.restoreWidget(entry.id);
        closeMenu();
        error.hidden = true;
        render();
        (add.disabled ? save : add).focus();
      });
      item.appendChild(button);
      menu.appendChild(item);
    }
  }

  function beginEdit() {
    if (destroyed || !desktop || model.isEditing) return;
    beforeEdit();
    model.beginEdit();
    error.hidden = true;
    for (const widget of widgets) {
      const { container } = widget;
      const shell = document.createElement("div");
      shell.className = "grid-widget";
      shell.dataset.widgetId = widget.id;
      shell.setAttribute("role", "group");
      shell.setAttribute("aria-label", widget.name);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "grid-widget__remove";
      remove.dataset.removeWidget = widget.id;
      remove.textContent = "−";
      remove.setAttribute("aria-label", `Прибрати віджет «${widget.name}»`);
      remove.addEventListener("click", () => {
        if (!desktop || !model.isEditing || !model.hideWidget(widget.id))
          return;
        closeMenu();
        error.hidden = true;
        render();
        save.focus();
      });
      const wasInert = container.hasAttribute("inert");
      container.setAttribute("inert", "");
      container.hidden = false;
      container.replaceWith(shell);
      shell.append(container, remove);
      shells.set(widget.id, { container, shell, remove, wasInert });
    }
    render();
    save.focus();
  }

  function cancelEdit() {
    if (!desktop || !model.isEditing) return;
    model.cancel();
    closeMenu();
    error.hidden = true;
    removeShells();
    render();
    edit.focus();
  }

  edit.addEventListener("click", beginEdit);
  cancel.addEventListener("click", cancelEdit);
  reset.addEventListener("click", () => {
    if (!desktop || !model.isEditing) return;
    model.reset();
    closeMenu();
    error.hidden = true;
    render();
  });
  add.addEventListener("click", () => {
    if (!desktop || !model.isEditing || add.disabled) return;
    const open = menu.hidden;
    menu.hidden = !open;
    add.setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector("button")?.focus();
  });
  save.addEventListener("click", () => {
    if (!desktop || !model.isEditing) return;
    closeMenu();
    if (!model.save((layout) => saveDashboardLayout(layout, widgetIds))) {
      error.textContent =
        "Не вдалося зберегти налаштування. Спробуйте ще раз або скасуйте зміни.";
      error.hidden = false;
      return;
    }
    error.hidden = true;
    removeShells();
    render();
    edit.focus();
  });

  function updateAvailability() {
    const available = desktopMedia.matches && !touchMedia.matches;
    if (available === desktop) return;
    model?.cancel();
    closeMenu();
    error.hidden = true;
    removeShells();
    desktop = available;
    // Touch devices never read or repair a saved desktop preference.
    if (desktop && !model)
      model = new DashboardLayout(widgetIds, readDashboardLayout(widgetIds));
    render();
  }

  function onOutsidePointer(event) {
    if (!addGroup.contains(event.target)) closeMenu();
  }

  function onKeydown(event) {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
      add.focus();
    }
  }

  // Native inert handles user input. This also blocks dispatched events and
  // prevents a renderer's handlers from running while its content is inert.
  function blockContentInteraction(event) {
    if (
      !model?.isEditing ||
      !widgets.some(({ container }) => container.contains(event.target))
    )
      return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "focusin") save.focus();
  }
  const blockedEvents = [
    "click",
    "dblclick",
    "pointerover",
    "pointerdown",
    "contextmenu",
    "keydown",
    "focusin",
  ];
  for (const type of blockedEvents)
    grid.addEventListener(type, blockContentInteraction, true);
  document.addEventListener("pointerdown", onOutsidePointer);
  document.addEventListener("keydown", onKeydown);
  desktopMedia.addEventListener("change", updateAvailability);
  touchMedia.addEventListener("change", updateAvailability);
  updateAvailability();

  const editor = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      model?.cancel();
      removeShells();
      applyLayout(desktop && model ? model.savedLayout : defaults);
      for (const type of blockedEvents)
        grid.removeEventListener(type, blockContentInteraction, true);
      document.removeEventListener("pointerdown", onOutsidePointer);
      document.removeEventListener("keydown", onKeydown);
      desktopMedia.removeEventListener("change", updateAvailability);
      touchMedia.removeEventListener("change", updateAvailability);
      toolbar.replaceChildren();
      toolbar.hidden = true;
      initializedToolbars.delete(toolbar);
    },
  };
  initializedToolbars.set(toolbar, editor);
  return editor;
}
