export class Spinner {
  constructor() {
    this.spinnerElement = this.createSpinnerElement();
  }

  createSpinnerElement() {
    const spinnerContainer = document.createElement("div");
    spinnerContainer.className = "loader-container";
    spinnerContainer.style.display = "none";

    const spinner = document.createElement("div");
    spinner.className = "loader";

    spinner.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="loader-1" x="0px" y="0px"
            width="40px" height="40px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">
            <path fill="#FBC142" d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z">
                <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/>
            </path>
        </svg>
      `;

    spinnerContainer.appendChild(spinner);

    document.body.appendChild(spinnerContainer);

    return spinnerContainer;
  }

  show() {
    this.spinnerElement.style.display = "flex";
  }

  hide() {
    this.spinnerElement.style.display = "none";
  }

  addToDOM(parentElementId) {
    const parentElement = document.getElementById(parentElementId);
    parentElement.appendChild(this.spinnerElement);
  }
}
