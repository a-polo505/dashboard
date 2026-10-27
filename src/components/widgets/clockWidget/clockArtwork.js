export function createClockHands(prefix) {
  return `<svg class="clock__hands" viewBox="0 0 175 175" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${prefix}-second" x1="0" y1="-76" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset=".572658" stop-color="var(--clock-second-start)"/><stop offset=".853529" stop-color="var(--clock-second-end)"/></linearGradient>
      <linearGradient id="${prefix}-hour" x1="9.75067" y1="33.135" x2="48.4737" y2="14.9805" gradientUnits="userSpaceOnUse"><stop stop-color="var(--clock-hour-start)"/><stop offset="1" stop-color="var(--clock-hand-end)"/></linearGradient>
      <linearGradient id="${prefix}-minute" x1="3.04707" y1="4.5" x2="60.3736" y2="-6.45056" gradientUnits="userSpaceOnUse"><stop stop-color="var(--clock-minute-start)"/><stop offset="1" stop-color="var(--clock-hand-end)"/></linearGradient>
      <linearGradient id="${prefix}-hub" x1="5" y1=".5" x2="10.5" y2="16.5" gradientUnits="userSpaceOnUse"><stop stop-color="var(--clock-hub-start)"/><stop offset="1" stop-color="var(--clock-hub-end)"/></linearGradient>
      <linearGradient id="${prefix}-hub-border" x1="4" y1=".5" x2="10" y2="16" gradientUnits="userSpaceOnUse"><stop offset=".0802633" stop-color="var(--clock-hub-border-start)"/><stop offset=".463119" stop-color="var(--clock-hub-border-middle)"/><stop offset="1" stop-color="var(--clock-hub-border-end)"/></linearGradient>
      <linearGradient id="${prefix}-pin" x1="6.5" y1="5" x2="11" y2="14" gradientUnits="userSpaceOnUse"><stop stop-color="var(--clock-pin-start)"/><stop offset="1" stop-color="var(--clock-pin-end)"/></linearGradient>
      <filter id="${prefix}-pin-shadow" x="3" y="3" width="10" height="10" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feMorphology radius="1" operator="dilate" in="SourceAlpha" result="expandedAlpha"/>
        <feGaussianBlur in="expandedAlpha" stdDeviation=".5" result="blurredAlpha"/>
        <feComposite in="blurredAlpha" in2="SourceAlpha" operator="out" result="shadowMask"/>
        <feFlood flood-color="var(--clock-shadow-color)" flood-opacity=".1" result="shadowColor"/>
        <feComposite in="shadowColor" in2="shadowMask" operator="in" result="shadow"/>
        <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g transform="translate(87.5 87.5)">
      <g class="clock__second"><rect x="-1" y="-76" width="2" height="76" rx="1" fill="url(#${prefix}-second)"/></g>
      <g class="clock__hour"><g transform="rotate(90) translate(-56.75 -32)">
        <path d="M9.43878 34.3189C8.03595 33.179 7.99284 31.0473 9.35313 29.857C12.8117 26.8308 17.3219 25.2866 21.9094 25.5579L57.0192 27.6344L57.0187 36.1344L21.5725 38.2314C17.1846 38.491 12.8502 37.0907 9.43878 34.3189Z" fill="url(#${prefix}-hour)"/>
        <path d="M20.171 33.0752C19.0927 32.9235 19.0671 31.3664 20.1437 31.2032C20.444 31.1577 20.7474 31.1364 21.051 31.1396L56.7516 31.5052L56.7512 32.7644L21.0225 33.1305C20.738 33.1334 20.4527 33.1148 20.171 33.0752Z" fill="var(--clock-hour-groove)" style="mix-blend-mode:color-burn"/>
      </g></g>
      <g class="clock__minute"><g transform="rotate(90) translate(-66 -4.5)">
        <path d="M2.15959 5.42C1.34882 5.07461 1.34882 3.92539 2.1596 3.58L9.34872 .517405C10.1488 .176547 11.0135 .01371 11.8828 .0401717L66 1.6875V7.87501L11.8513 8.97386C11.0023 8.99109 10.1593 8.8279 9.37803 8.49508L2.15959 5.42Z" fill="url(#${prefix}-minute)"/>
        <path d="M19.4014 5.6499C18.2401 5.49875 18.2401 3.80106 19.4014 3.6499L59.719 4.02491V5.39991L19.4014 5.6499Z" fill="var(--clock-minute-groove)" style="mix-blend-mode:color-burn"/>
      </g></g>
      <g class="clock__hub" transform="translate(-8 -8)">
        <circle cx="8" cy="8" r="7.5" fill="url(#${prefix}-hub)" stroke="url(#${prefix}-hub-border)"/>
        <circle cx="8" cy="8" r="3" fill="url(#${prefix}-pin)" filter="url(#${prefix}-pin-shadow)"/>
      </g>
    </g>
  </svg>`;
}
