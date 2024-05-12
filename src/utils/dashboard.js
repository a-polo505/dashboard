export class Dashboard {
  constructor() {
    this.widgets = [];
  }

  addWidget(widget) {
    this.widgets.push(widget);
  }

  removeWidget(widget) {
    const index = this.widgets.indexOf(widget);
    if (index !== -1) {
      this.widgets.splice(index, 1);
    }
  }

  updateWidgets() {
    this.widgets.forEach((widget) => {
      widget.updateContent();
    });
  }
}
