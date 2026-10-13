import {
  getEndCoordinates,
  getArc,
  getArcBackground,
} from "../src/components/widgets/timeWidget/timeWidgetGeometry.js";

describe("day progress geometry without DOM", () => {
  test.each([
    [0, 50, 10],
    [25, 90, 50],
    [50, 50, 90],
    [75, 10, 50],
    [100, 50, 10],
    ["75.00", 10, 50],
  ])("places the endpoint at %s percent at (%s, %s)", (progress, x, y) => {
    const [endX, endY] = getEndCoordinates(progress);

    expect(endX).toBeCloseTo(x, 10);
    expect(endY).toBeCloseTo(y, 10);
  });

  test("keeps an almost complete day on the circle near the top left", () => {
    const [x, y] = getEndCoordinates("99.99");

    expect(x).toBeLessThan(50);
    expect(y).toBeGreaterThan(10);
    expect(x).toBeCloseTo(50, 1);
    expect(y).toBeCloseTo(10, 1);
    expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(40, 10);
  });

  test.each([
    [0, 0, 50, 10],
    [25, 0, 90, 50],
    [50, 0, 50, 90],
    [75, 1, 10, 50],
    [100, 1, 50, 10],
    ["75.00", 1, 10, 50],
  ])(
    "draws a clockwise arc with the expected endpoint at %s percent",
    (progress, largeArc, x, y) => {
      const parts = getArc(progress).split(" ");

      expect(parts.slice(0, 4)).toEqual([
        "M50,10",
        "A40,40",
        "0",
        `${largeArc},1`,
      ]);
      const [endX, endY] = parts[4].split(",").map(Number);
      expect(endX).toBeCloseTo(x, 10);
      expect(endY).toBeCloseTo(y, 10);
    },
  );

  test.each([
    ["49.99", "0,1"],
    ["50.00", "0,1"],
    ["50.01", "1,1"],
  ])("uses the correct arc size around half a day (%s)", (progress, flags) => {
    expect(getArc(progress).split(" ")[3]).toBe(flags);
  });

  test("draws the complete background circle with two semicircles", () => {
    expect(getArcBackground()).toBe(
      "M50,50 m0,-40 a40,40 0 1,0 0,80 a40,40 0 1,0 0,-80",
    );
  });
});
