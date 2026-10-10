import { widgetCurrencyRender } from "../src/utils/widgetCurrencyRender.js";

const currencies = [
  {
    data: {
      USD: { code: "USD", value: 1 },
      UAH: { code: "UAH", value: 41 },
      EUR: { code: "EUR", value: 0.9 },
    },
  },
];
const currenciesDiff = [
  {
    data: {
      UAH: { code: "UAH", value: 40 },
      EUR: { code: "EUR", value: 1 },
      BYN: { code: "BYN", value: 3 },
    },
  },
];

describe("currency rendering with an explicit selection", () => {
  test.each(["BYN", "RUB", "ZZZ", "toString", "", "UAH "])(
    "renders UAH for an unavailable explicit selection (%#)",
    (code) => {
      const content = widgetCurrencyRender(currencies, currenciesDiff, code);

      expect(content).toContain("USD / UAH");
      expect(content).toContain('id="rate" class="flex currency--rate">41<');
    },
  );

  test("defaults to UAH without browser storage", () => {
    const content = widgetCurrencyRender(currencies, currenciesDiff);

    expect(content).toContain("USD / UAH");
  });

  test("preserves a valid selection and its existing percentage calculation", () => {
    const content = widgetCurrencyRender(currencies, currenciesDiff, "EUR");

    expect(content).toContain("USD / EUR");
    expect(content).toContain('id="rate" class="flex currency--rate">0.9<');
    expect(content).toContain("currency--percentage negative");
    expect(content).toContain("10%");
  });

  test("bases availability on current data without a hardcoded currency blacklist", () => {
    const currentCurrencies = [
      { data: { ...currencies[0].data, BYN: { code: "BYN", value: 3 } } },
    ];

    const content = widgetCurrencyRender(
      currentCurrencies,
      currenciesDiff,
      "BYN",
    );

    expect(content).toContain("USD / BYN");
  });

  test.each([
    ["missing history", undefined],
    ["null history", null],
    ["empty history", []],
    ["missing historical data", [{}]],
    ["null historical data", [{ data: null }]],
    [
      "missing selected currency in history",
      [{ data: { UAH: { value: 40 } } }],
    ],
  ])("keeps a valid selection with %s", (description, history) => {
    const content = widgetCurrencyRender(currencies, history, "EUR");

    expect(content).toContain("USD / EUR");
    expect(content).toContain("currency--percentage neutral");
    expect(content).toContain("0.00%");
  });

  test("recovers an unavailable selection even when history is absent", () => {
    const content = widgetCurrencyRender(currencies, [], "BYN");

    expect(content).toContain("USD / UAH");
    expect(content).toContain("currency--percentage neutral");
  });

  test.each([0, -1, "40", null, undefined, Infinity, NaN, {}])(
    "uses a neutral percentage when the historical rate is invalid (%#)",
    (value) => {
      const content = widgetCurrencyRender(currencies, [
        { data: { UAH: { value } } },
      ]);

      expect(content).toContain("currency--percentage neutral");
      expect(content).toContain("0.00%");
      expect(content).not.toContain("NaN");
      expect(content).not.toContain("Infinity");
    },
  );

  test.each([
    ["missing payload", undefined],
    ["null payload", null],
    ["empty payload", []],
    ["error response", { error: "Server error" }],
    ["missing data", [{}]],
    ["null data", [{ data: null }]],
    ["array data", [{ data: [] }]],
    ["empty data", [{ data: {} }]],
    ["missing USD", [{ data: { UAH: currencies[0].data.UAH } }]],
    ["missing UAH", [{ data: { USD: currencies[0].data.USD } }]],
    [
      "invalid rate",
      [{ data: { ...currencies[0].data, EUR: { code: "EUR", value: "0.9" } } }],
    ],
    [
      "mismatched currency code",
      [{ data: { ...currencies[0].data, EUR: { code: "GBP", value: 0.9 } } }],
    ],
  ])(
    "rejects invalid data before rendering (%s)",
    (description, currentCurrencies) => {
      expect(() =>
        widgetCurrencyRender(currentCurrencies, currenciesDiff),
      ).toThrow("Invalid currency data");
    },
  );
});
