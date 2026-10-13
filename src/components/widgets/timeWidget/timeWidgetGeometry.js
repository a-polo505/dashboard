export function getEndCoordinates(elapsedPercentage) {
  const radius = 40;
  const totalLength = 2 * Math.PI * radius;
  const arcLength = (elapsedPercentage / 100) * totalLength;
  const endX = 50 + Math.sin(arcLength / radius) * radius;
  const endY = 50 - Math.cos(arcLength / radius) * radius;
  return [endX, endY];
}

export function getArc(elapsedPercentage) {
  const radius = 40;
  const startX = 50 + Math.sin(0) * radius;
  const startY = 50 - Math.cos(0) * radius;
  const [endX, endY] = getEndCoordinates(elapsedPercentage);
  const largeArcFlag = elapsedPercentage > 50 ? 1 : 0;
  return `M${startX},${startY} A${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}`;
}

export function getArcBackground() {
  const radius = 40;
  return `M50,50 m0,-${radius} a${radius},${radius} 0 1,0 0,${2 * radius} a${radius},${radius} 0 1,0 0,-${2 * radius}`;
}
