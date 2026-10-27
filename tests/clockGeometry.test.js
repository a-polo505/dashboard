import { getClockAngles } from "../src/components/widgets/clockWidget/clockGeometry.js";

describe("local clock geometry", () => {
  test.each([
    [0, 0, 0, 0, { hour: 0, minute: 0, second: 0 }],
    [12, 0, 0, 0, { hour: 0, minute: 0, second: 0 }],
    [3, 15, 30, 0, { hour: 97.75, minute: 93, second: 180 }],
    [15, 15, 30, 500, { hour: 97.7541666667, minute: 93.05, second: 183 }],
    [
      23,
      59,
      59,
      999,
      { hour: 359.9999916667, minute: 359.9999, second: 359.994 },
    ],
  ])(
    "computes all hands for %s:%s:%s.%s local time",
    (hour, minute, second, ms, expected) => {
      const result = getClockAngles(
        new Date(2026, 9, 26, hour, minute, second, ms),
      );
      for (const hand of ["hour", "minute", "second"]) {
        expect(result[hand]).toBeCloseTo(expected[hand], 8);
      }
    },
  );

  test("takes the new calendar day's time directly after midnight", () => {
    const before = getClockAngles(new Date(2026, 9, 26, 23, 59, 59, 999));
    const after = getClockAngles(new Date(2026, 9, 27, 0, 0, 0, 0));
    expect(before.second).toBeGreaterThan(359);
    expect(after).toEqual({ hour: 0, minute: 0, second: 0 });
  });
});
