import { createContainer } from "./utils/container.js";
import { fetchDataAndDisplay } from "./utils/fetchUtils.js";
import "./utils/widgetInitializer.js";

const defaultContainerContent = '<p class="default-text-style">Soon 🛠</p>';

document.addEventListener("DOMContentLoaded", fetchDataAndDisplay);

const defaultContainer1 = createContainer("Small", defaultContainerContent);
defaultContainer1.classList.add("green-color");
document.getElementById("col-3").appendChild(defaultContainer1);

const defaultContainer2 = createContainer("Small", defaultContainerContent);
defaultContainer2.classList.add("blue-color");
document.getElementById("col-2").appendChild(defaultContainer2);
