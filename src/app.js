import "./styles/styles.css";
import { fetchDataAndDisplay } from "./utils/fetchUtils.js";
import "./utils/widgetInitializer.js";
import "./components/ui/tooltip/infoTooltip.js";

document.addEventListener("DOMContentLoaded", fetchDataAndDisplay);
