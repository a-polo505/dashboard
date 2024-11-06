// class BookmarksWidgetRenderer {
//   render() {
//     const container = document.createElement("div");
//     container.classList.add(
//       "flex",
//       "flex-col",
//       "justify-between",
//       "h-100",
//       "wraper",
//     );

//     const containerContent = `
//         <div class="flex w-100 gap-8 align-center header">
//           <svg width="10" height="14" viewBox="0 0 14 20" fill="none" class="widget-icon" xmlns="http://www.w3.org/2000/svg">
//             <path d="M1.99902 19.3223C2.47363 19.3223 2.78125 19.0762 3.52832 18.3467L6.9209 14.9893C6.95605 14.9453 7.03516 14.9453 7.07031 14.9893L10.4717 18.3467C11.2188 19.0762 11.5176 19.3223 12.001 19.3223C12.7041 19.3223 13.1436 18.8389 13.1436 18.0479V2.70215C13.1436 0.953125 12.2295 0.0302734 10.498 0.0302734H3.49316C1.76172 0.0302734 0.847656 0.953125 0.847656 2.70215V18.0479C0.847656 18.8389 1.28711 19.3223 1.99902 19.3223Z" fill="#114DB3"/>
//           </svg>
//           <p class="title">Bookmarks</p>
//         </div>
//         <div class="flex links-box">
//           <a href="https://www.figma.com" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-figma">
//                 <svg width="25" height="38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.25 37.5c3.45 0 6.25-2.8 6.25-6.25V25H6.25C2.8 25 0 27.8 0 31.25s2.8 6.25 6.25 6.25Z" fill="#0ACF83"/><path d="M0 18.75c0-3.45 2.8-6.25 6.25-6.25h6.25V25H6.25C2.8 25 0 22.2 0 18.75Z" fill="#A259FF"/><path d="M0 6.25C0 2.8 2.8 0 6.25 0h6.25v12.5H6.25C2.8 12.5 0 9.7 0 6.25Z" fill="#F24E1E"/><path d="M12.5 0h6.25C22.2 0 25 2.8 25 6.25s-2.8 6.25-6.25 6.25H12.5V0Z" fill="#FF7262"/><path d="M25 18.75C25 22.2 22.2 25 18.75 25s-6.25-2.8-6.25-6.25 2.8-6.25 6.25-6.25S25 15.3 25 18.75Z" fill="#1ABCFE"/></svg>
//               </div>
//               <p class="bookmarks-link-text">Figma</p></div></a>
//           <a href="https://github.com/" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-github">
//                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="56" height="56"><path d="M256 32C132.288 32 32 132.288 32 256c0 99.488 64.32 183.68 153.6 213.568 11.232 2.048 15.36-4.864 15.36-10.816 0-5.376-.192-19.584-.288-38.4-62.464 13.568-75.68-25.216-75.68-25.216-10.208-25.92-24.928-32.832-24.928-32.832-20.352-13.92 1.536-13.632 1.536-13.632 22.528 1.6 34.368 23.168 34.368 23.168 20 34.304 52.448 24.384 65.28 18.656 2.048-14.464 7.84-24.384 14.272-30.016-49.92-5.632-102.368-24.992-102.368-111.168 0-24.544 8.768-44.608 23.168-60.352-2.336-5.664-10.048-28.48 2.176-59.392 0 0 18.944-6.08 62.08 23.2 18.016-5.024 37.296-7.552 56.528-7.68 19.2.128 38.496 2.656 56.528 7.68 43.104-29.28 62.016-23.2 62.016-23.2 12.256 30.912 4.544 53.728 2.208 59.392 14.432 15.744 23.136 35.808 23.136 60.352 0 86.432-52.544 105.472-102.56 111.008 8.064 6.944 15.232 20.736 15.232 41.728 0 30.144-.256 54.432-.256 61.888 0 5.984 4.064 12.928 15.424 10.784C415.68 439.648 480 355.456 480 256c0-123.712-100.288-224-224-224z" fill="#FFF"/></svg></div>
//               <p class="bookmarks-link-text">Github</p></div></a>
//           <a href="https://openai.com" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link"">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-chatgpt">
//               <svg width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M33.626 14.732a8.847 8.847 0 0 0-.78-7.364 9.16 9.16 0 0 0-4.234-3.766 9.32 9.32 0 0 0-5.669-.584 9.086 9.086 0 0 0-3.097-2.24A9.199 9.199 0 0 0 16.086 0a9.28 9.28 0 0 0-5.423 1.731 9.076 9.076 0 0 0-3.347 4.552A9.157 9.157 0 0 0 3.802 7.81a9.013 9.013 0 0 0-2.562 2.822 8.976 8.976 0 0 0 1.132 10.634 8.855 8.855 0 0 0 .78 7.357 9.16 9.16 0 0 0 4.235 3.773 9.32 9.32 0 0 0 5.675.586 9.089 9.089 0 0 0 3.094 2.238 9.202 9.202 0 0 0 3.755.78 9.28 9.28 0 0 0 5.424-1.731 9.076 9.076 0 0 0 3.346-4.552 9.155 9.155 0 0 0 3.514-1.528 9.012 9.012 0 0 0 2.56-2.822 8.965 8.965 0 0 0-1.129-10.635Zm-13.715 18.92a6.87 6.87 0 0 1-4.377-1.565c.054-.03.16-.081.22-.12l7.267-4.139c.183-.102.334-.25.439-.43.105-.178.16-.382.158-.589V16.701l3.07 1.748a.105.105 0 0 1 .06.085V26.9c0 3.726-3.06 6.748-6.837 6.752ZM5.218 27.463a6.652 6.652 0 0 1-.817-4.52c.054.033.15.09.216.127l7.27 4.14a1.194 1.194 0 0 0 1.193 0l8.868-5.059v3.497a.104.104 0 0 1-.043.094l-7.347 4.182c-3.27 1.858-7.449.753-9.34-2.469v.008ZM3.314 11.811a6.788 6.788 0 0 1 3.56-2.958v8.52c-.002.207.053.41.158.59.105.18.256.328.438.43l8.87 5.052L13.26 25.2a.108.108 0 0 1-.103.01L5.81 21.025c-3.268-1.865-4.388-5.988-2.502-9.215h.006Zm25.23 5.792-8.87-5.053 3.068-1.75a.112.112 0 0 1 .102-.01l7.346 4.184a6.787 6.787 0 0 1 2.643 2.722 6.668 6.668 0 0 1-.626 7.21 6.834 6.834 0 0 1-3.074 2.24v-8.52a1.151 1.151 0 0 0-.155-.591 1.173 1.173 0 0 0-.438-.432h.005Zm3.059-4.54a8.458 8.458 0 0 0-.216-.127l-7.27-4.14a1.193 1.193 0 0 0-1.193 0l-8.87 5.052v-3.496a.113.113 0 0 1 .044-.093l7.346-4.183a6.914 6.914 0 0 1 7.329.312 6.764 6.764 0 0 1 2.398 2.933c.5 1.183.649 2.481.428 3.744l.004-.002ZM12.38 19.3l-3.072-1.748a.116.116 0 0 1-.06-.084V9.1a6.677 6.677 0 0 1 1.066-3.62 6.809 6.809 0 0 1 2.87-2.492 6.922 6.922 0 0 1 3.776-.583 6.885 6.885 0 0 1 3.503 1.508c-.054.03-.15.081-.219.12l-7.268 4.139c-.182.102-.333.25-.438.43-.105.179-.16.382-.158.589v10.108Zm1.668-3.548 3.95-2.25 3.95 2.25v4.499l-3.95 2.25-3.952-2.25.002-4.499Z" fill="#fff"/></svg>
//               </div>
//               <p class="bookmarks-link-text">OpenAI</p></div></a>
//           <a href="https://x.com/home" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link"">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-twitter">
//                 <svg width="31" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M.023 32h2.702l10.574-12.414L21.707 32H31L18.47 13.59 29.975 0h-2.748l-9.992 11.756L9.223 0H0l12.111 17.822L.023 32ZM3.727 2.093h4.169L27.25 30.025h-4.215L3.727 2.093Z" fill="#fff"/></svg>
//               </div>
//               <p class="bookmarks-link-text">X</p></div></a>
//           <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-dribbble">
//               <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 39.375c10.7 0 19.375-8.674 19.375-19.375C39.375 9.3 30.701.625 20 .625 9.3.625.625 9.299.625 20 .625 30.7 9.299 39.375 20 39.375Z" fill="#EA4C89"/><path fill-rule="evenodd" clip-rule="evenodd" d="M20 0C8.959 0 0 8.959 0 20s8.959 20 20 20c11.02 0 20-8.959 20-20S31.02 0 20 0Zm13.21 9.22a17.004 17.004 0 0 1 3.862 10.628c-.564-.108-6.204-1.258-11.888-.542-.13-.282-.238-.586-.368-.89a50.879 50.879 0 0 0-1.128-2.472c6.29-2.56 9.154-6.248 9.522-6.725ZM20 2.95c4.338 0 8.308 1.627 11.323 4.295-.303.434-2.885 3.883-8.959 6.16-2.798-5.14-5.9-9.349-6.377-10A17.373 17.373 0 0 1 20 2.95Zm-7.267 1.605c.456.608 3.493 4.838 6.334 9.87-7.982 2.126-15.032 2.083-15.792 2.083 1.107-5.293 4.686-9.697 9.458-11.953ZM2.907 20.022v-.52c.737.02 9.024.13 17.549-2.43.498.954.954 1.93 1.388 2.906-.217.065-.456.13-.673.195C12.364 23.015 7.68 30.782 7.288 31.433a17.043 17.043 0 0 1-4.381-11.41ZM20 37.093a16.963 16.963 0 0 1-10.477-3.6c.303-.63 3.774-7.31 13.405-10.673.044-.022.066-.022.109-.043 2.408 6.225 3.384 11.453 3.644 12.95A16.8 16.8 0 0 1 20 37.093Zm9.523-2.928c-.174-1.041-1.085-6.03-3.32-12.17 5.359-.845 10.044.543 10.63.738-.737 4.75-3.47 8.85-7.31 11.432Z" fill="#C32361"/>
//               </svg></div>
//               <p class="bookmarks-link-text">Dribbble</p></div></a>
//           <a href="https://layers.to" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-layers">
//                 <svg width="32" height="33" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#a)" fill="#111827"><path d="M0 18.83.08 6.832c.014-2.172 1.533-4.034 3.63-4.45L15.297.087c2.784-.552 5.368 1.627 5.35 4.51l-.08 12c-.015 2.17-1.534 4.032-3.63 4.448L5.348 23.34C2.565 23.893-.019 21.714 0 18.83Z" fill-opacity=".2"/><path d="m5.677 23.617.08-12c.013-2.17 1.533-4.031 3.63-4.447l11.587-2.296c2.784-.552 5.368 1.626 5.349 4.51l-.08 12c-.014 2.171-1.533 4.032-3.63 4.448l-11.587 2.297c-2.784.551-5.368-1.627-5.349-4.51v-.002Z" fill-opacity=".5"/><path d="m11.354 28.404.08-12c.014-2.172 1.533-4.032 3.63-4.448l11.587-2.297c2.784-.552 5.368 1.627 5.349 4.51l-.08 12c-.014 2.172-1.533 4.033-3.63 4.448l-11.587 2.297c-2.784.552-5.368-1.627-5.35-4.51h.001Z" fill-opacity=".8"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h32v33H0z"/></clipPath></defs></svg>
//               </div>
//               <p class="bookmarks-link-text">Layers</p></div></a>
//           <a href="https://mobbin.com/browse/web/screens" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-mobbin">
//                 <svg width="46" height="21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M46 9.8H34.5V21H46V9.8ZM0 21v-9.86L11.438 0h10.124v9.86L10.125 21H0Z" fill="#fff"/><path d="M17.25 21v-9.86L28.688 0h10.125v9.86L27.374 21H17.25Z" fill="#fff"/></svg>
//               </div>
//               <p class="bookmarks-link-text">Mobbin</p></div></a>
//           <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-linkedin">
//                 <svg width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M29.638 0H2.362A2.362 2.362 0 0 0 0 2.362v27.276A2.362 2.362 0 0 0 2.362 32h27.276A2.362 2.362 0 0 0 32 29.638V2.362A2.362 2.362 0 0 0 29.638 0Zm-20.1 27.26H4.727V11.978h4.81V27.26Zm-2.41-17.4A2.762 2.762 0 1 1 9.908 7.1a2.722 2.722 0 0 1-2.778 2.76Zm20.143 17.413h-4.809v-8.349c0-2.462-1.046-3.222-2.398-3.222-1.426 0-2.826 1.076-2.826 3.285v8.286h-4.811V11.99h4.626v2.118h.063c.464-.94 2.09-2.547 4.573-2.547 2.684 0 5.584 1.593 5.584 6.26l-.002 9.453Z" fill="#fff"/></svg>
//               </div>
//               <p class="bookmarks-link-text">Linkedin</p></div></a>
//           <a href="https://read.cv/explore" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-readcv">
//                 <svg width="30" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="m3.75 27.629 15.179 4.065a4.323 4.323 0 0 0 5.292-3.057l5.085-18.973a4.322 4.322 0 0 0-3.055-5.293L11.071.306A4.321 4.321 0 0 0 5.78 3.361L.695 22.336a4.321 4.321 0 0 0 3.055 5.293Zm7.235-21.153c.153-.02.31-.01.459.03l-.002.003 11.384 3.048a1.177 1.177 0 0 1-.139 2.323c-.158.016-.318 0-.47-.047L10.834 8.784a1.178 1.178 0 0 1 .152-2.308Zm-1.738 5.099c.263-.157.577-.206.875-.135l11.384 3.048a1.18 1.18 0 1 1-.61 2.279L9.511 13.715a1.178 1.178 0 0 1-.264-2.14ZM7.905 16.49a1.179 1.179 0 0 0 .284 2.16l7.59 2.033a1.18 1.18 0 0 0 1.023-2.074 1.178 1.178 0 0 0-.413-.203L8.8 16.372a1.179 1.179 0 0 0-.894.118Z" fill="#EEE"/></svg>
//               </div>
//               <p class="bookmarks-link-text">Read.cv</p></div></a>
//           <a href="https://medium.com" target="_blank" rel="noopener noreferrer nofollow" referrerpolicy="origin" class="icon-link">
//             <div class="flex flex-col gap-2 align-center">
//               <div class="bookmarks-link-box bg-medium flex">
//                 <svg style="margin-left: auto;" width="53" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M53 29.859v6.085c-.364.037-.738.056-1.122.056-6.851 0-10.709-5.992-10.875-13.49a22.6 22.6 0 0 1 .037-1.68l.022-.298c.246-3.31 1.261-6.257 2.937-8.437 1.04-1.353 2.291-2.384 3.71-3.073C48.953 8.363 50.704 8 52.131 8h.062c.27 0 .539.01.806.028v1.675a3.5 3.5 0 0 0-.91-.131c-2.886.062-4.606 3.692-4.82 8.722H53v1.417h-5.86l-.002.002c-.264 4.9 2.29 9.042 5.862 10.146Z" fill="#fff"/><path d="M40.949.41 41 .4V0H30.58l-9.674 22.961L11.232 0H.004v.399l.05.011c1.902.434 2.867 1.08 2.867 3.411v27.293c0 2.332-.969 2.978-2.87 3.412L0 34.537v.4h7.618v-.399l-.05-.011c-1.902-.434-2.868-1.08-2.868-3.411V5.405l12.428 29.532h.705l12.79-30.356V31.79c-.163 1.841-1.12 2.41-2.842 2.802l-.05.012V35H41v-.396l-.051-.012c-1.724-.392-2.704-.96-2.867-2.802L38.074 3.82h.008c0-2.33.966-2.977 2.867-3.41Z" fill="#fff"/></svg>
//               </div>
//               <p class="bookmarks-link-text">Medium</p></div></a>
//         </div>
//         <p id="total-saved" class="link-total"></p>
//       `;

//     container.innerHTML = containerContent;

//     this.updateTotalSaved(container);

//     return container;
//   }

//   updateTotalSaved(container) {
//     const linkBoxes = container.querySelectorAll(".bookmarks-link-box");
//     const totalSavedElement = container.querySelector("#total-saved");
//     totalSavedElement.textContent = `Total bookmarks: ${linkBoxes.length}`;
//   }
// }

// export { BookmarksWidgetRenderer };

class BookmarksWidgetRenderer {
  constructor(bookmarks) {
    this.bookmarks = bookmarks;
  }

  render() {
    const container = this.createContainer();
    const header = this.createHeader();
    const linksBox = this.createLinksBox();
    const totalSavedElement = this.createTotalSavedElement();

    container.appendChild(header);
    container.appendChild(linksBox);
    container.appendChild(totalSavedElement);

    this.updateTotalSaved(totalSavedElement, linksBox);

    return container;
  }

  createContainer() {
    const container = document.createElement("div");
    container.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "h-100",
      "wraper",
    );
    return container;
  }

  createHeader() {
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("flex", "w-100", "gap-8", "align-center", "header");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "10");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 14 20");
    svg.setAttribute("fill", "none");
    svg.classList.add("widget-icon");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M1.99902 19.3223C2.47363 19.3223 2.78125 19.0762 3.52832 18.3467L6.9209 14.9893C6.95605 14.9453 7.03516 14.9453 7.07031 14.9893L10.4717 18.3467C11.2188 19.0762 11.5176 19.3223 12.001 19.3223C12.7041 19.3223 13.1436 18.8389 13.1436 18.0479V2.70215C13.1436 0.953125 12.2295 0.0302734 10.498 0.0302734H3.49316C1.76172 0.0302734 0.847656 0.953125 0.847656 2.70215V18.0479C0.847656 18.8389 1.28711 19.3223 1.99902 19.3223Z",
    );
    path.setAttribute("fill", "#114DB3");
    svg.appendChild(path);

    const title = document.createElement("p");
    title.classList.add("title");
    title.textContent = "Bookmarks";

    headerDiv.appendChild(svg);
    headerDiv.appendChild(title);

    return headerDiv;
  }

  createLinksBox() {
    const linksBox = document.createElement("div");
    linksBox.classList.add("flex", "links-box");

    this.bookmarks.forEach((bookmark) => {
      const linkElement = this.createLinkElement(bookmark);
      linksBox.appendChild(linkElement);
    });

    return linksBox;
  }

  createLinkElement(bookmark) {
    const link = document.createElement("a");
    link.href = bookmark.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
    link.referrerPolicy = "origin";
    link.classList.add("icon-link");

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("flex", "flex-col", "gap-2", "align-center");

    const linkBox = document.createElement("div");
    linkBox.classList.add("bookmarks-link-box", bookmark.className);
    linkBox.innerHTML = bookmark.svgIcon;

    const linkText = document.createElement("p");
    linkText.classList.add("bookmarks-link-text");
    linkText.textContent = bookmark.text;

    contentDiv.appendChild(linkBox);
    contentDiv.appendChild(linkText);
    link.appendChild(contentDiv);

    return link;
  }

  createTotalSavedElement() {
    const totalSavedElement = document.createElement("p");
    totalSavedElement.id = "total-saved";
    totalSavedElement.classList.add("link-total");
    return totalSavedElement;
  }

  updateTotalSaved(totalSavedElement, linksBox) {
    const linkBoxes = linksBox.querySelectorAll(".bookmarks-link-box");
    totalSavedElement.textContent = `Total bookmarks: ${linkBoxes.length}`;
  }
}

export { BookmarksWidgetRenderer };
