const NOISE_THRESHOLD = [...Array(51).fill(1), ...Array(49).fill(0)].join(" ");
const RINGS = [
  [76, 24, 3.5],
  [72, 32, 3.5],
  [68, 40, 3.5],
  [64, 48, 3.5],
  [60, 56, 3.5],
  [56, 64, 3.5],
  [52, 72, 3.5],
  [48, 80, 3.5],
  [44, 88, 3.5],
  [40, 96, 3.5],
  [36, 104, 5.5],
  [32, 112, 5.5],
  [28, 120, 5.5],
  [24, 128, 6.5],
  [20, 136, 6.5],
  [16, 144, 10.5],
  [12, 152, 13.5],
];

function noiseFilter(id, x, y, size) {
  return `<filter id="${id}" x="${x}" y="${y}" width="${size}" height="${size}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" seed="2362" result="noise"/>
    <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise"/>
    <feComponentTransfer in="alphaNoise" result="coloredNoise"><feFuncA type="discrete" tableValues="${NOISE_THRESHOLD}"/></feComponentTransfer>
    <feComposite in="coloredNoise" in2="SourceGraphic" operator="in" result="clippedNoise"/>
    <feFlood flood-color="var(--clock-noise-color)" result="noiseColor"/>
    <feComposite in="noiseColor" in2="clippedNoise" operator="in" result="noiseOverlay"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="noiseOverlay"/></feMerge>
  </filter>`;
}

export function createClockBackground(prefix) {
  const filters = [noiseFilter(`${prefix}-noise-0`, 0, 0, 175)];
  const rings = RINGS.map(([position, size, radius], index) => {
    const id = `${prefix}-noise-${index + 1}`;
    filters.push(noiseFilter(id, position, position, size));
    return `<g filter="url(#${id})"><rect x="-.5" y=".5" width="${size - 1}" height="${size - 1}" rx="${radius}" transform="matrix(-1 0 0 1 ${position + size - 1} ${position})" stroke="var(--clock-ring-color)" style="mix-blend-mode:color-dodge"/></g>`;
  }).join("");
  return `<svg class="clock__face" viewBox="0 0 175 175" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${filters.join("")}
      <linearGradient id="${prefix}-background" x1="87.5" y1="0" x2="87.5" y2="175" gradientUnits="userSpaceOnUse"><stop stop-color="var(--clock-background-start)"/><stop offset="1" stop-color="var(--clock-background-end)"/></linearGradient>
    </defs>
    <g filter="url(#${prefix}-noise-0)">
      <rect width="175" height="175" rx="28" fill="url(#${prefix}-background)"/>
    </g>
    ${rings}
    <g class="clock__numerals" text-anchor="middle">
      <text x="87.5" y="39">12</text>
      <text x="152" y="101">3</text>
      <text x="87.5" y="162">6</text>
      <text x="25" y="101">9</text>
    </g>
  </svg>`;
}
