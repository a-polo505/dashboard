export function getCurrentDate() {
  return new Date();
}

export function getWeeksInYear(year) {
  const firstDayOfYear = new Date(year, 0, 1);
  const lastDayOfYear = new Date(year, 11, 31);

  let firstWeek = firstDayOfYear.getDay();
  if (firstWeek === 0) firstWeek = 7;

  let lastWeek = lastDayOfYear.getDay();
  if (lastWeek === 0) lastWeek = 7;

  const weeksInYear =
    Math.ceil((lastDayOfYear - firstDayOfYear + 1) / (24 * 60 * 60 * 1000)) / 7;

  return weeksInYear;
}

export function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const millisecondsInDay = 86400000;
  const daysOffset = (date - firstDayOfYear) / millisecondsInDay;
  const weekNumber = Math.ceil((daysOffset + firstDayOfYear.getDay() + 1) / 7);
  return weekNumber;
}

export function getRemainingWeeksOfYear(weeksInYear, currentWeek) {
  const remainingWeeks = Math.ceil(weeksInYear) - currentWeek;
  return remainingWeeks;
}
