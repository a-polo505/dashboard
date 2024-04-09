import { calculatePercentageChange } from "../src/utils/widgetCurrencyRender";

describe("calculatePercentageChange function", () => {
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
