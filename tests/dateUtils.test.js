import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { diffDays } from "../src/utils/dateUtils.js";

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
});

describe("diffDays across timezone offset changes", () => {
  // Each process starts with its own TZ; these tests exercise DST even on UTC CI.
  test.each([
    ["Europe/Kyiv", "2026-03-28T12:00:00", "2026-03-30T12:00:00", -60],
    ["Europe/Kyiv", "2026-10-24T12:00:00", "2026-10-26T12:00:00", 60],
    ["America/Los_Angeles", "2026-03-07T12:00:00", "2026-03-09T12:00:00", -60],
    ["America/Los_Angeles", "2026-10-31T12:00:00", "2026-11-02T12:00:00", 60],
    ["Australia/Lord_Howe", "2026-04-04T12:00:00", "2026-04-06T12:00:00", 30],
    ["Australia/Lord_Howe", "2026-10-03T12:00:00", "2026-10-05T12:00:00", -30],
    ["UTC", "2026-10-24T12:00:00", "2026-10-26T12:00:00", 0],
  ])(
    "counts both directions in %s between %s and %s",
    (timezone, from, to, offsetChange) => {
      const moduleUrl = pathToFileURL(
        require.resolve("../src/utils/dateUtils.js"),
      ).href;
      const script = `
        const { diffDays } = await import(${JSON.stringify(moduleUrl)});
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
        console.log(JSON.stringify({
          forward, backward,
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
      });
    },
  );
});
