import { dismissActiveTooltip } from "../components/ui/tooltip/TooltipManager.js";
import { closeContextMenu } from "../components/ui/contextMenu/currencyContextMenu.js";
import { closeCountdownDatePicker } from "../components/widgets/dateCountdownWidget/dateCountdownWidget.js";

export function closeWidgetOverlays(widgets) {
  dismissActiveTooltip();
  closeContextMenu({ animate: false });
  const countdown = widgets.find((widget) => widget.id === "countdown");
  if (countdown) closeCountdownDatePicker(countdown.container);
}
