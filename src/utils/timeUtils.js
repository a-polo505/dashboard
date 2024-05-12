export function getRemainingPercentage() {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  const totalMinutes = currentHour * 60 + currentMinutes;
  const remainingPercentage = ((totalMinutes / (24 * 60)) * 100).toFixed(2);
  return remainingPercentage;
}
