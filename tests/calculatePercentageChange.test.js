import { calculatePercentageChange } from "../src/utils/currencyCalculations.js";

describe("calculatePercentageChange function", () => {
  test.each([1e-7, 1.234567e-7, 9.999999e-7])(
    "avoids dividing by an exponential historical rate that truncates to zero (%s)",
    (previous) => {
      expect(
        calculatePercentageChange(
          "EUR",
          [{ data: { EUR: { value: previous } } }],
          { value: 0.0001 },
        ),
      ).toBeNull();
    },
  );

  test("truncates a tiny current rate to zero before calculating the change", () => {
    expect(
      calculatePercentageChange("EUR", [{ data: { EUR: { value: 0.0001 } } }], {
        value: 1.234567e-7,
      }),
    ).toBe(-100);
  });

  test.each([
    [1.2e21, 1.8e21, 50],
    [1.8e21, 1.2e21, -33.33],
    [1.2e21, 1.2e21, 0],
    [1.2e21, 1.2e22, 900],
  ])(
    "preserves magnitude for exponential rates (%s -> %s)",
    (previous, current, expected) => {
      expect(
        calculatePercentageChange(
          "EUR",
          [{ data: { EUR: { value: previous } } }],
          { value: current },
        ),
      ).toBe(expected);
    },
  );

  test.each([
    [44.9776059592, 44.9776084585],
    [44.9776084585, 44.9776059592],
    [44.9776, 44.9777],
    [44.9777, 44.9776],
  ])(
    "returns zero for a change below displayed precision (%s -> %s)",
    (previous, current) => {
      const result = calculatePercentageChange(
        "UAH",
        [{ data: { UAH: { value: previous } } }],
        { value: current },
      );

      expect(result).toBe(0);
    },
  );

  test.each([
    [100.0049, 0],
    [100.0051, 0.01],
    [99.9951, 0],
    [99.9949, -0.01],
  ])(
    "returns a signed percentage rounded to two places (%s)",
    (current, expected) => {
      const result = calculatePercentageChange(
        "UAH",
        [{ data: { UAH: { value: 100 } } }],
        { value: current },
      );

      expect(result).toBe(expected);
    },
  );

  test.each([
    [1.23459, 1.23461, 0.01],
    [1.23461, 1.23459, -0.01],
  ])(
    "calculates from both rates truncated to four places, without rounding them (%s -> %s)",
    (previous, current, expected) => {
      const result = calculatePercentageChange(
        "EUR",
        [{ data: { EUR: { value: previous } } }],
        { value: current },
      );

      expect(result).toBe(expected);
    },
  );

  test.each([0.00001, 0.00009])(
    "avoids dividing by a historical rate that truncates to zero (%s)",
    (previous) => {
      const result = calculatePercentageChange(
        "EUR",
        [{ data: { EUR: { value: previous } } }],
        { value: 0.0001 },
      );

      expect(result).toBeNull();
    },
  );

  test.each([
    ["missing history", undefined],
    ["null history", null],
    ["empty history", []],
    ["null historical document", [null]],
    ["missing historical data", [{}]],
    ["null historical data", [{ data: null }]],
    ["empty historical data", [{ data: {} }]],
    ["missing selected currency", [{ data: { UAH: { value: 40 } } }]],
  ])("returns no calculation for %s", (description, history) => {
    const result = calculatePercentageChange("EUR", history, { value: 0.9 });

    expect(result).toBeNull();
  });

  test("should return equal percentage change when quote currency value equals diff value", () => {
    const quoteCurrencyCode = "EUR";
    const currenciesDiff = [{ data: { EUR: { value: 10.1234556 } } }];
    const quoteCurrency = { value: 10.1234556 };

    const result = calculatePercentageChange(
      quoteCurrencyCode,
      currenciesDiff,
      quoteCurrency,
    );

    expect(result).toBe(0);
  });

  test("should return positive percentage change when quote currency value is greater than diff value", () => {
    const quoteCurrencyCode = "EUR";
    const currenciesDiff = [{ data: { EUR: { value: 5 } } }];
    const quoteCurrency = { value: 10 };

    const result = calculatePercentageChange(
      quoteCurrencyCode,
      currenciesDiff,
      quoteCurrency,
    );

    expect(result).toBe(100);
  });

  test("should return negative percentage change when quote currency value is less than diff value", () => {
    const quoteCurrencyCode = "EUR";
    const currenciesDiff = [{ data: { EUR: { value: 15 } } }];
    const quoteCurrency = { value: 10 };

    const result = calculatePercentageChange(
      quoteCurrencyCode,
      currenciesDiff,
      quoteCurrency,
    );

    expect(result).toBe(-33.33);
  });
});
