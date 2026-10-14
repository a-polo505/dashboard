import {
  createDefaultLayout,
  DashboardLayout,
} from "../../../utils/dashboardLayout.js";
import {
  readDashboardLayout,
  saveDashboardLayout,
} from "../../../utils/dashboardLayoutStorage.js";
import { initializeGridDrag } from "./gridDragController.js";
import { IconButton } from "../button/IconButton.js";
import { createGridActionIcon } from "./gridActionIcons.js";

const initializedToolbars = new WeakMap();
const DESKTOP_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
const TOUCH_QUERY = "(any-pointer: coarse)";

function createGridActionButton(id, label, action, onClick) {
  return new IconButton({
    id,
    label,
    icon: createGridActionIcon(action),
    onClick,
    classNames: ["grid-editor__button"],
  }).render();
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
  let drag = null;
  let model = null;
  let desktop;
  let destroyed = false;

  const gridActions = document.createElement("div");
  gridActions.className = "grid-editor__actions";
  const customizeButton = createGridActionButton(
    "customizeButton",
    "Customize",
    "customize",
    beginCustomization,
  );
  customizeButton.setAttribute("aria-controls", grid.id);
  const cancelCustomizationButton = createGridActionButton(
    "cancelCustomizationButton",
    "Cancel",
    "cancelCustomization",
    cancelCustomization,
  );
  const resetLayoutButton = createGridActionButton(
    "resetLayoutButton",
    "Reset Layout",
    "resetLayout",
    resetLayout,
  );
  const addWidgetButton = createGridActionButton(
    "addWidgetButton",
    "Add Widget",
    "addWidget",
    toggleAddWidgetMenu,
  );
  const saveLayoutButton = createGridActionButton(
    "saveLayoutButton",
    "Save",
    "saveLayout",
    saveLayout,
  );
  const addWidgetGroup = document.createElement("div");
  addWidgetGroup.className = "grid-editor__add";
  const addWidgetMenu = document.createElement("ul");
  addWidgetMenu.id = "addWidgetMenu";
  addWidgetMenu.className = "grid-editor__menu";
  addWidgetMenu.hidden = true;
  addWidgetButton.setAttribute("aria-controls", addWidgetMenu.id);
  addWidgetButton.setAttribute("aria-expanded", "false");
  addWidgetGroup.append(addWidgetButton, addWidgetMenu);
  gridActions.append(
    cancelCustomizationButton,
    resetLayoutButton,
    addWidgetGroup,
    customizeButton,
    saveLayoutButton,
  );
  const saveLayoutError = document.createElement("p");
  saveLayoutError.className = "grid-editor__error";
  saveLayoutError.setAttribute("role", "alert");
  saveLayoutError.hidden = true;
  toolbar.replaceChildren(gridActions, saveLayoutError);

  function closeMenu() {
    addWidgetMenu.hidden = true;
    addWidgetButton.setAttribute("aria-expanded", "false");
  }

  function removeShells() {
    drag?.destroy();
    drag = null;
    grid.classList.remove("grid--editing");
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
    customizeButton.hidden = editing;
    cancelCustomizationButton.hidden = !editing;
    resetLayoutButton.hidden = !editing;
    addWidgetGroup.hidden = !editing;
    saveLayoutButton.hidden = !editing;
    const removed = layout.filter((widget) => widget.is_remove);
    addWidgetButton.disabled = removed.length === 0;
    const visibleCount = layout.length - removed.length;
    for (const { shell, remove } of shells.values()) {
      remove.hidden = visibleCount === 1;
      shell.classList.toggle("grid-widget--fixed", visibleCount === 1);
    }
    addWidgetMenu.replaceChildren();
    for (const entry of removed) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = byId.get(entry.id).name;
      button.addEventListener("click", () => {
        if (!desktop || !model.isEditing) return;
        drag?.cancel();
        model.restoreWidget(entry.id);
        closeMenu();
        saveLayoutError.hidden = true;
        render();
        (addWidgetButton.disabled ? saveLayoutButton : addWidgetButton).focus();
      });
      item.appendChild(button);
      addWidgetMenu.appendChild(item);
    }
  }

  function beginCustomization() {
    if (destroyed || !desktop || model.isEditing) return;
    beforeEdit();
    model.beginEdit();
    grid.classList.add("grid--editing");
    saveLayoutError.hidden = true;
    for (const widget of widgets) {
      const { container } = widget;
      const shell = document.createElement("div");
      shell.className = "grid-widget";
      shell.dataset.widgetId = widget.id;
      shell.setAttribute("role", "group");
      shell.setAttribute("aria-label", widget.name);
      const surface = document.createElement("div");
      surface.className = "grid-widget__surface";
      const card = document.createElement("div");
      card.className = "grid-widget__card";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "grid-widget__remove";
      remove.dataset.removeWidget = widget.id;
      const removeIcon = createGridActionIcon("removeWidget");
      removeIcon.setAttribute("width", "16");
      removeIcon.setAttribute("height", "16");
      removeIcon.setAttribute("aria-hidden", "true");
      removeIcon.setAttribute("focusable", "false");
      remove.append(removeIcon);
      remove.setAttribute("aria-label", `Remove widget: ${widget.name}`);
      remove.addEventListener("click", () => {
        if (!desktop || !model.isEditing) return;
        drag?.cancel();
        if (!model.hideWidget(widget.id)) return;
        closeMenu();
        saveLayoutError.hidden = true;
        render();
        saveLayoutButton.focus();
      });
      const wasInert = container.hasAttribute("inert");
      container.setAttribute("inert", "");
      container.hidden = false;
      container.replaceWith(shell);
      card.append(container, remove);
      surface.append(card);
      shell.append(surface);
      shells.set(widget.id, { container, shell, remove, wasInert });
    }
    render();
    drag = initializeGridDrag({
      grid,
      onStart: closeMenu,
      onDrop(id, index) {
        if (model.moveWidget(id, index)) saveLayoutError.hidden = true;
        applyLayout(model.layout);
      },
      onCancel: () => applyLayout(model.layout),
    });
    saveLayoutButton.focus();
  }

  function cancelCustomization() {
    if (!desktop || !model.isEditing) return;
    drag?.cancel();
    model.cancel();
    closeMenu();
    saveLayoutError.hidden = true;
    removeShells();
    render();
    customizeButton.focus();
  }

  function resetLayout() {
    if (!desktop || !model.isEditing) return;
    drag?.cancel();
    model.reset();
    closeMenu();
    saveLayoutError.hidden = true;
    render();
  }

  function toggleAddWidgetMenu() {
    if (!desktop || !model.isEditing || addWidgetButton.disabled) return;
    drag?.cancel();
    const open = addWidgetMenu.hidden;
    addWidgetMenu.hidden = !open;
    addWidgetButton.setAttribute("aria-expanded", String(open));
    if (open) addWidgetMenu.querySelector("button")?.focus();
  }

  function saveLayout() {
    if (!desktop || !model.isEditing) return;
    drag?.cancel();
    closeMenu();
    if (!model.save((layout) => saveDashboardLayout(layout, widgetIds))) {
      saveLayoutError.textContent =
        "Could not save the layout. Try again or cancel customization.";
      saveLayoutError.hidden = false;
      return;
    }
    saveLayoutError.hidden = true;
    removeShells();
    render();
    customizeButton.focus();
  }

  function updateAvailability() {
    const available = desktopMedia.matches && !touchMedia.matches;
    if (available === desktop) return;
    drag?.cancel();
    model?.cancel();
    closeMenu();
    saveLayoutError.hidden = true;
    removeShells();
    desktop = available;
    // Touch devices never read or repair a saved desktop preference.
    if (desktop && !model)
      model = new DashboardLayout(widgetIds, readDashboardLayout(widgetIds));
    render();
  }

  function onOutsidePointer(event) {
    if (!addWidgetGroup.contains(event.target)) closeMenu();
  }

  function onKeydown(event) {
    if (event.key === "Escape" && !addWidgetMenu.hidden) {
      closeMenu();
      addWidgetButton.focus();
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
    if (event.type === "focusin") saveLayoutButton.focus();
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
      drag?.cancel();
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
