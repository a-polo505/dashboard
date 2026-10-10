const contextMenuContainer = document.getElementById("contextMenuContainer");
let contextMenuOpen = false;
let searchInput;
let currencyCodes;
let currencyList;

const triggerCurrencyChangeEvent = (userCurrency) => {
  const currencyChangeEvent = new CustomEvent("currencyChange", {
    detail: {
      userCurrency,
    },
  });
  document.dispatchEvent(currencyChangeEvent);
};

const handleClickOutside = (e) => {
  if (contextMenuOpen && !contextMenuContainer.contains(e.target)) {
    closeContextMenu();
  }
};

export const closeContextMenu = () => {
  if (contextMenuOpen) {
    contextMenuOpen = false;
    const animationCircle = createAnimationCircle();

    contextMenuContainer.remove();
    document.removeEventListener("mousedown", handleClickOutside);

    animateAndRemoveCircle(animationCircle);
  }
};

const createAnimationCircle = () => {
  const animationCircle = document.createElement("div");
  animationCircle.classList.add("animation-circle");

  const currencyPairButton = document.getElementById("currencyPair");
  const buttonRect = currencyPairButton.getBoundingClientRect();
  const left = buttonRect.left + window.scrollX;
  const top = buttonRect.bottom + window.scrollY;

  animationCircle.style.left = `${left}px`;
  animationCircle.style.top = `${top}px`;

  document.body.appendChild(animationCircle);

  return animationCircle;
};

const animateAndRemoveCircle = (animationCircle) => {
  setTimeout(() => {
    animationCircle.style.transform = "scale(2)";
    animationCircle.style.opacity = "0";
  }, 0);

  setTimeout(() => {
    animationCircle.remove();
  }, 300);
};

const renderCurrencyList = (currencies) => {
  currencyList.innerHTML = "";

  currencies.forEach((currencyCode) => {
    const currencyItem = createCurrencyItem(currencyCode);
    currencyList.appendChild(currencyItem);
  });
};

const createCurrencyItem = (currencyCode) => {
  const currencyItem = document.createElement("li");
  const currencyButton = document.createElement("button");

  currencyButton.textContent = currencyCode;

  currencyItem.appendChild(currencyButton);
  currencyItem.addEventListener("click", () => {
    triggerCurrencyChangeEvent(currencyCode);
    closeContextMenu();
  });

  return currencyItem;
};

const handleSearchInput = () => {
  const searchValue = searchInput.value.trim().toLowerCase();

  const filteredCurrencies = currencyCodes.filter((currencyCode) => {
    const normalizedCurrencyCode = currencyCode.toLowerCase();
    return normalizedCurrencyCode.startsWith(searchValue);
  });
  renderCurrencyList(filteredCurrencies);
};

export const showContextMenu = (codes) => {
  if (!Array.isArray(codes) || codes.length === 0) return;
  currencyCodes = codes;
  contextMenuContainer.innerHTML = "";
  contextMenuContainer.classList.add("context-menu-container");

  searchInput = createSearchInput();
  contextMenuContainer.appendChild(searchInput);

  currencyList = createCurrencyList();

  const contextMenu = createContextMenu(currencyList);

  contextMenuContainer.appendChild(contextMenu);
  contextMenuContainer.classList.add("open");

  const currencyPairButton = document.getElementById("currencyPair");
  const buttonRect = currencyPairButton.getBoundingClientRect();

  const left = buttonRect.left + window.scrollX;
  const top = buttonRect.bottom + window.scrollY;
  contextMenuContainer.style.left = `${left}px`;
  contextMenuContainer.style.top = `${top}px`;

  contextMenu.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("mousedown", handleClickOutside);

  document.body.appendChild(contextMenuContainer);
  contextMenuOpen = true;

  const listRect = currencyList.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  if (listRect.bottom > viewportHeight || listRect.top < 0) {
    searchInput.focus();
  } else {
    currencyList.focus();
  }
};

const createSearchInput = () => {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("context-menu-search");
  input.placeholder = "UAH";
  input.maxLength = 4;
  input.addEventListener("input", handleSearchInput);
  input.addEventListener("keydown", restrictInput);

  return input;
};

const restrictInput = (event) => {
  const allowedCharacters = /[A-Za-z]/;

  if (!allowedCharacters.test(event.key)) {
    event.preventDefault();
  }
};

const createCurrencyList = () => {
  const list = document.createElement("ul");
  list.classList.add("flex", "flex-col");

  list.setAttribute("tabindex", "0");

  currencyCodes.forEach((currencyCode) => {
    const currencyItem = createCurrencyItem(currencyCode);
    list.appendChild(currencyItem);
  });

  return list;
};

const createContextMenu = (currencyList) => {
  const contextMenu = document.createElement("div");
  contextMenu.id = "contextMenu";
  contextMenu.classList.add("context-menu");
  contextMenu.appendChild(currencyList);

  return contextMenu;
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (document.activeElement === searchInput) {
      searchInput.blur();
      currencyList.focus();
    } else if (contextMenuOpen) {
      closeContextMenu();
    }
  }
});
