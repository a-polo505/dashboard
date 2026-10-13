export function getDayProgressPercentage() {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  const elapsedMinutes = currentHour * 60 + currentMinutes;
  const elapsedPercentage = ((elapsedMinutes / (24 * 60)) * 100).toFixed(2);
  return elapsedPercentage;
}
