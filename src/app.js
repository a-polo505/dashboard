import { createContainer } from "./components/container.js";
import { fetchDataAndDisplay } from "./utils/fetchUtils.js";
import { getCurrentDate } from "./utils/widgetDateRender.js";

const defaultContainerContent = '<p class="default-text-style">Soon 🛠</p>';
const dateContainerContent = getCurrentDate();

document.addEventListener("DOMContentLoaded", fetchDataAndDisplay);

const defaultContainer = createContainer("Small", defaultContainerContent);
defaultContainer.classList.add("magenta-color");
document.getElementById("col-2").appendChild(defaultContainer);

const defaultContainer2 = createContainer("Small", defaultContainerContent);
defaultContainer2.classList.add("sky-color");
document.getElementById("col-2").appendChild(defaultContainer2);

const defaultContainer3 = createContainer("Small", defaultContainerContent);
defaultContainer3.classList.add("green-color");
document.getElementById("col-3").appendChild(defaultContainer3);

const defaultContainer4 = createContainer("Small", dateContainerContent);
defaultContainer4.classList.add("ocean-color");
document.getElementById("col-1").appendChild(defaultContainer4);

const defaultContainer5 = createContainer("Small", defaultContainerContent);
defaultContainer5.classList.add("blue-color");
document.getElementById("col-3").appendChild(defaultContainer5);
