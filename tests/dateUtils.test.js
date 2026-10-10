import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  diffDays,
  getWeeksInYear,
  getWeekNumber,
  getRemainingWeeksOfYear,
} from "../src/utils/dateUtils.js";

describe("diffDays calendar arithmetic", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 10, 23, 59, 59));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test.each([
    ["today at midnight", new Date(2026, 9, 10), 0],
    ["tomorrow at midnight", new Date(2026, 9, 11), 1],
    ["yesterday", new Date(2026, 9, 9, 12), -1],
    ["next month", new Date(2026, 10, 1, 12), 22],
    ["next year", new Date(2027, 0, 1), 83],
  ])("counts local calendar days for %s", (name, selectedDate, expected) => {
    expect(diffDays(selectedDate)).toBe(expected);
  });

  test("counts leap day across February and March", () => {
    jest.setSystemTime(new Date(2028, 1, 28, 12));

    expect(diffDays(new Date(2028, 2, 1))).toBe(2);
  });

  test("does not change the supplied date or its time", () => {
    const selectedDate = new Date(2026, 9, 11, 17, 45, 12, 345);
    const timestamp = selectedDate.getTime();

    expect(diffDays(selectedDate)).toBe(1);
    expect(selectedDate.getTime()).toBe(timestamp);
  });

  test("preserves the year when it is less than 100", () => {
    const today = new Date(0);
    today.setHours(12, 0, 0, 0);
    today.setFullYear(99, 11, 31);
    jest.setSystemTime(today);
    const selectedDate = new Date(0);
    selectedDate.setHours(12, 0, 0, 0);
    selectedDate.setFullYear(100, 0, 1);

    expect(diffDays(selectedDate)).toBe(1);
  });

  test("returns NaN for an invalid Date so callers can reject it", () => {
    expect(diffDays(new Date("invalid"))).toBeNaN();
  });

  test("can use a captured reference date for a consistent render at year rollover", () => {
    const referenceDate = new Date(2026, 11, 31, 23, 59);

    expect(diffDays(new Date(2027, 0, 1), referenceDate)).toBe(1);
  });
});

describe("diffDays across timezone offset changes", () => {
  // Each process starts with its own TZ; these tests exercise DST even on UTC CI.
  test.each([
    ["Europe/Kyiv", "2026-03-28T12:00:00", "2026-03-30T12:00:00", -60, 13],
    ["Europe/Kyiv", "2026-10-24T12:00:00", "2026-10-26T12:00:00", 60, 43],
    [
      "America/Los_Angeles",
      "2026-03-07T12:00:00",
      "2026-03-09T12:00:00",
      -60,
      10,
    ],
    [
      "America/Los_Angeles",
      "2026-10-31T12:00:00",
      "2026-11-02T12:00:00",
      60,
      44,
    ],
    [
      "Australia/Lord_Howe",
      "2026-04-04T12:00:00",
      "2026-04-06T12:00:00",
      30,
      14,
    ],
    [
      "Australia/Lord_Howe",
      "2026-10-03T12:00:00",
      "2026-10-05T12:00:00",
      -30,
      40,
    ],
    ["UTC", "2026-10-24T12:00:00", "2026-10-26T12:00:00", 0, 43],
  ])(
    "counts both directions in %s between %s and %s",
    (timezone, from, to, offsetChange, week) => {
      const moduleUrl = pathToFileURL(
        require.resolve("../src/utils/dateUtils.js"),
      ).href;
      const script = `
        const { diffDays, getWeekNumber } = await import(${JSON.stringify(moduleUrl)});
        const OriginalDate = Date;
        const from = new OriginalDate(${JSON.stringify(from)});
        const to = new OriginalDate(${JSON.stringify(to)});
        let now = from;
        globalThis.Date = class extends OriginalDate {
          constructor(...args) {
            super(...(args.length ? args : [now.getTime()]));
          }
        };
        const forward = diffDays(new OriginalDate(to));
        now = to;
        const backward = diffDays(new OriginalDate(from));
        const sunday = new OriginalDate(to);
        sunday.setDate(sunday.getDate() - 1);
        const sundayWeeks = [0, 12, 23].map(hour => {
          sunday.setHours(hour, 0, 0, 0);
          return getWeekNumber(sunday);
        });
        console.log(JSON.stringify({
          forward, backward,
          fromWeek: getWeekNumber(from), toWeek: getWeekNumber(to), sundayWeeks,
          offsetChange: to.getTimezoneOffset() - from.getTimezoneOffset()
        }));
      `;
      const output = execFileSync(
        process.execPath,
        ["--input-type=module", "-e", script],
        {
          env: { ...process.env, TZ: timezone },
          encoding: "utf8",
          timeout: 10000,
        },
      );

      expect(JSON.parse(output)).toEqual({
        forward: 2,
        backward: -2,
        offsetChange,
        fromWeek: week,
        toWeek: week + 1,
        sundayWeeks: [week, week, week],
      });
    },
  );
});

describe("calendar-year weeks from Monday to Sunday", () => {
  test.each([
    [2012, 54],
    [2023, 53],
    [2024, 53],
    [2026, 53],
    [2028, 53],
  ])(
    "counts all intersecting weeks in %i, including partial weeks",
    (year, total) => {
      expect(getWeeksInYear(year)).toBe(total);
      expect(getWeekNumber(new Date(year, 0, 1))).toBe(1);
      expect(getWeekNumber(new Date(year, 11, 31, 23, 59))).toBe(total);
    },
  );

  test.each([
    [new Date(2026, 0, 4, 0), 1],
    [new Date(2026, 0, 4, 12), 1],
    [new Date(2026, 0, 4, 23, 59), 1],
    [new Date(2026, 0, 5, 0), 2],
    [new Date(2026, 0, 11, 12), 2],
    [new Date(2026, 11, 28), 53],
    [new Date(2023, 0, 1, 12), 1],
    [new Date(2023, 0, 2), 2],
  ])("keeps week boundaries at Monday midnight for %s", (date, week) => {
    expect(getWeekNumber(date)).toBe(week);
  });

  test("counts future weeks without including the current week", () => {
    const total = getWeeksInYear(2026);
    expect(getRemainingWeeksOfYear(total, 1)).toBe(52);
    expect(getRemainingWeeksOfYear(total, 41)).toBe(12);
    expect(getRemainingWeeksOfYear(total, 53)).toBe(0);
  });

  test("does not mutate the supplied date", () => {
    const date = new Date(2026, 9, 10, 12, 30);
    const timestamp = date.getTime();

    expect(getWeekNumber(date)).toBe(41);
    expect(date.getTime()).toBe(timestamp);
  });
});
