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
  ])("formats rate %s as %s", (rate, expected) => {
    expect(formatCurrencyRate(rate)).toBe(expected);
  });
});
