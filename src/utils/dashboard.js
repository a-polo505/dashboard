export class Dashboard {
  constructor() {
    this.widgets = [];
  }

  addWidget({ id, name, container }) {
    if (this.widgets.some((widget) => widget.id === id)) {
      throw new Error(`Widget already registered: ${id}`);
    }
    container.dataset.widgetId = id;
    this.widgets.push({ id, name, container });
  }
}
