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

export function diffDays(selectedDate, currentDate = new Date()) {
  return (
    (getCalendarDateTimestamp(selectedDate) -
      getCalendarDateTimestamp(currentDate)) /
    (1000 * 60 * 60 * 24)
  );
}

export function getWeeksInYear(year) {
  const lastDayOfYear = new Date(0);
  lastDayOfYear.setFullYear(year, 11, 31);
  return getWeekNumber(lastDayOfYear);
}

export function getWeekNumber(date) {
  const firstDayOfYear = new Date(0);
  firstDayOfYear.setUTCFullYear(date.getFullYear(), 0, 1);
  const mondayOffset = (firstDayOfYear.getUTCDay() + 6) % 7;
  const daysOffset =
    (getCalendarDateTimestamp(date) - firstDayOfYear.getTime()) / 86400000;

  // Week 1 contains January 1; subsequent weeks begin on local Mondays.
  return Math.floor((daysOffset + mondayOffset) / 7) + 1;
}

export function getRemainingWeeksOfYear(weeksInYear, currentWeek) {
  return weeksInYear - currentWeek;
}

export function getDaysInCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}
