import { formatCurrencyRate } from "../src/utils/currencyFormatting.js";

describe("currency rate formatting without HTML", () => {
  test.each([
    [44.9776059592, "44.9776"],
    [44.9776084585, "44.9776"],
    [1.23459, "1.2345"],
    [9.99999, "9.9999"],
    [41, "41"],
    [0.9, "0.9"],
    [1.23, "1.23"],
    [0.0001, "0.0001"],
    [0.00009, "0"],
    [10000.12345, "10000.123"],
    [12345678.9, "12345678"],
    [123456789.9, "123456789"],
    [1234567890, "123456789"],
    [1e-7, "0"],
    [1.234567e-7, "0"],
    [9.999999e-7, "0"],
    [1.23e21, "1.23e+21"],
  ])("formats rate %s as %s", (rate, expected) => {
    expect(formatCurrencyRate(rate)).toBe(expected);
  });

  test.each([
    [1e21, "1e+21"],
    [1.234e21, "1.234e+21"],
    [1.234567e21, "1.234e+21"],
    [9.999999e21, "9.999e+21"],
    [1.234567e100, "1.23e+100"],
    [Number.MAX_VALUE, "1.79e+308"],
    [-1.234567e21, "-1.23e+21"],
    [-Number.MAX_VALUE, "-1.7e+308"],
  ])("shortens only the mantissa of %s to %s", (rate, expected) => {
    const result = formatCurrencyRate(rate);

    expect(result).toBe(expected);
    expect(result.length).toBeLessThanOrEqual(9);
    expect(result.split("e")[1]).toBe(rate.toString().split("e")[1]);
    expect(Number.isFinite(Number(result))).toBe(true);
    expect(Math.abs(Number(result))).toBeLessThanOrEqual(Math.abs(rate));
  });
});
