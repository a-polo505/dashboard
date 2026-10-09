export function getCurrentDate() {
  return new Date();
}

function getCalendarDateTimestamp(date) {
  const calendarDate = new Date(0);
  // Map local calendar components to UTC midnight, independent of DST offsets.
  // setUTCFullYear also preserves years 0–99 instead of treating them as 1900–1999.
  calendarDate.setUTCFullYear(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return calendarDate.getTime();
}

export function diffDays(selectedDate) {
  const currentDate = new Date();
  return (
    (getCalendarDateTimestamp(selectedDate) -
      getCalendarDateTimestamp(currentDate)) /
    (1000 * 60 * 60 * 24)
  );
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
  let firstDayOfWeek = firstDayOfYear.getDay();
  if (firstDayOfWeek === 0) firstDayOfWeek = 7;

  const millisecondsInDay = 86400000;
  const daysOffset = (date - firstDayOfYear) / millisecondsInDay;

  const weekNumber = Math.ceil((daysOffset + firstDayOfWeek) / 7);
  return weekNumber;
}

export function getRemainingWeeksOfYear(weeksInYear, currentWeek) {
  const remainingWeeks = Math.ceil(weeksInYear) - currentWeek;
  return remainingWeeks;
}

export function getDaysInCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}
