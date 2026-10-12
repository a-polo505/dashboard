import { calculatePercentageChange } from "../src/utils/widgetCurrencyRender";

describe("calculatePercentageChange function", () => {
  test.each([
    [44.9776059592, 44.9776084585],
    [44.9776084585, 44.9776059592],
    [44.9776, 44.9777],
    [44.9777, 44.9776],
  ])(
    "shows a neutral zero without a directional arrow for %s -> %s",
    (previous, current) => {
      const result = calculatePercentageChange(
        "UAH",
        [{ data: { UAH: { value: previous } } }],
        { value: current },
      );

      expect(result.percentageChange).toContain("0.00%");
      expect(result.percentageChange).toContain('d=""');
      expect(result.percentageChange).not.toContain("-0");
      expect(result.percentageClass).toBe("neutral");
    },
  );

  test.each([
    [100.0049, "0.00%", "neutral"],
    [100.0051, "0.01%", "positive"],
    [99.9951, "0.00%", "neutral"],
    [99.9949, "0.01%", "negative"],
  ])(
    "uses displayed percentage precision for the text and direction (%s)",
    (current, expectedText, expectedClass) => {
      const result = calculatePercentageChange(
        "UAH",
        [{ data: { UAH: { value: 100 } } }],
        { value: current },
      );

      expect(result.percentageChange).toContain(expectedText);
      expect(result.percentageClass).toBe(expectedClass);
      expect(result.percentageChange.includes('d=""')).toBe(
        expectedClass === "neutral",
      );
    },
  );

  test.each([
    [1.23459, 1.23461, "positive"],
    [1.23461, 1.23459, "negative"],
  ])(
    "calculates from both rates truncated to four places, without rounding them (%s -> %s)",
    (previous, current, expectedClass) => {
      const result = calculatePercentageChange(
        "EUR",
        [{ data: { EUR: { value: previous } } }],
        { value: current },
      );

      expect(result.percentageChange).toContain("0.01%");
      expect(result.percentageClass).toBe(expectedClass);
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

      expect(result).toEqual({
        percentageChange: "0.00%",
        percentageClass: "neutral",
      });
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
  ])("returns the neutral state for %s", (description, history) => {
    const result = calculatePercentageChange("EUR", history, { value: 0.9 });

    expect(result).toEqual({
      percentageChange: "0.00%",
      percentageClass: "neutral",
    });
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

    expect(result.percentageChange).toContain("<svg");
    expect(result.percentageChange).toContain("0.00%");
    expect(result.percentageChange).toContain('d=""');
    expect(result.percentageClass).toBe("neutral");
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

    expect(result.percentageChange).toContain("<svg");
    expect(result.percentageChange).toContain("100%");
    expect(result.percentageChange).toContain(
      'd="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"',
    );
    expect(result.percentageClass).toBe("positive");
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

    expect(result.percentageChange).toContain("<svg");
    expect(result.percentageChange).toContain("33.33%");
    expect(result.percentageChange).toContain(
      'd="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"',
    );
    expect(result.percentageClass).toBe("negative");
  });
});
