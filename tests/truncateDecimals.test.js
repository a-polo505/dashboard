import { truncateDecimals } from "../src/utils/currencyCalculations.js";

describe("truncateDecimals function", () => {
  test.each([
    [1e-7, 4, 0],
    [1.234567e-7, 4, 0],
    [9.999999e-7, 6, 0],
    [1.234567e-7, 7, 1e-7],
    [1.234567e-7, 8, 1.2e-7],
    [9.999999e-7, 7, 9e-7],
    [1.234567e-7, 13, 1.234567e-7],
    [-1.234567e-7, 4, -0],
    [-1.234567e-7, 8, -1.2e-7],
    [1e21, 4, 1e21],
    [1.234567e21, 4, 1.234567e21],
    [-1.234567e21, 4, -1.234567e21],
    [Number.MIN_VALUE, 4, 0],
    [Number.MIN_VALUE, 324, Number.MIN_VALUE],
    [Number.MAX_VALUE, 4, Number.MAX_VALUE],
    [44.9776, 4, 44.9776],
    [100.0014, 4, 100.0014],
    [44.9776084585, 4, 44.9776],
    [-44.9776084585, 4, -44.9776],
  ])("truncates %s to %s decimal places as %s", (number, digits, expected) => {
    expect(truncateDecimals(number, digits)).toBe(expected);
  });

  test("should truncate decimals correctly", () => {
    const number = 10.123456789;
    const digits = 4;
    const expected = 10.1234;

    const result = truncateDecimals(number, digits);

    expect(result.toFixed(digits)).toEqual(expected.toFixed(digits));
  });

  test("should return the same number when no decimals are truncated", () => {
    const number = 10;
    const digits = 4;
    const expected = 10;

    const result = truncateDecimals(number, digits);

    expect(result).toEqual(expected);
  });

  test("should handle negative numbers correctly", () => {
    const number = -10.123456789;
    const digits = 4;
    const expected = -10.1234;

    const result = truncateDecimals(number, digits);

    expect(result.toFixed(digits)).toEqual(expected.toFixed(digits));
  });
});
