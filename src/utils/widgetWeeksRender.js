export function createGrid(weeksInYear, currentWeek) {
  const gridContainer = document.createElement("div");
  gridContainer.classList.add("flex", "gap-4", "wrap");
  gridContainer.innerHTML = "";

  for (let week = 1; week <= weeksInYear; week++) {
    const gridItem = document.createElement("div");
    gridItem.classList.add("grid-item");
    gridItem.dataset.week = week;

    if (week < currentWeek) {
      gridItem.classList.add("past-week");
    } else if (week === currentWeek) {
      gridItem.classList.add("current-week");
    } else {
      gridItem.classList.add("future-week");
    }
    gridItem.addEventListener("mouseover", function (event) {
      showTooltip(gridItem.dataset.week, event);
    });

    gridItem.addEventListener("mouseout", function () {
      hideTooltip();
    });

    gridContainer.appendChild(gridItem);
  }
  return gridContainer;
}

function showTooltip(weekNumber, event) {
  const tooltip = document.createElement("div");
  tooltip.textContent = `Week ${weekNumber}`;
  tooltip.classList.add("tooltip");

  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;

  document.body.appendChild(tooltip);
}

function hideTooltip() {
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

export function displayDaysLeft(
  container,
  daysLeft,
  remainingWeeks,
  currentYear,
) {
  const daysLeftContainer = document.createElement("div");
  daysLeftContainer.classList.add("days-left");

  const weekPlural = remainingWeeks === 1 ? "" : "s";
  const dayPlural = daysLeft === 1 ? "" : "s";

  const daysLeftText = document.createElement("p");
  daysLeftText.classList.add("m-0");
  daysLeftText.innerHTML = `<span class="text-accent">${daysLeft} day${dayPlural}, ${remainingWeeks} week${weekPlural}</span> left until ${currentYear + 1}`;

  daysLeftContainer.appendChild(daysLeftText);
  container.appendChild(daysLeftContainer);
}
