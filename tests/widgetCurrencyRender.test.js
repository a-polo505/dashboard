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

const upArrow =
  "M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z";
const downArrow =
  "M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z";

describe("currency rendering with an explicit selection", () => {
  test.each([
    [5, 10, "100%", "positive", upArrow],
    [15, 10, "33.33%", "negative", downArrow],
    [10.1234556, 10.1234556, "0.00%", "neutral", ""],
    [100, 100.0049, "0.00%", "neutral", ""],
    [100, 100.0051, "0.01%", "positive", upArrow],
    [100, 99.9951, "0.00%", "neutral", ""],
    [100, 99.9949, "0.01%", "negative", downArrow],
    [44.9776, 44.9777, "0.00%", "neutral", ""],
    [44.9777, 44.9776, "0.00%", "neutral", ""],
  ])(
    "preserves percentage text, color and arrow (%s -> %s)",
    (previous, current, text, color, path) => {
      const currentCurrencies = [
        {
          data: { ...currencies[0].data, UAH: { code: "UAH", value: current } },
        },
      ];
      const history = [{ data: { UAH: { value: previous } } }];

      const content = widgetCurrencyRender(currentCurrencies, history);

      expect(content).toContain(`currency--percentage ${color}`);
      expect(content).toContain(`<path fill-rule="evenodd" d="${path}" />`);
      expect(content).toContain(text);
      expect(content).not.toContain("-0.00%");
    },
  );

  test.each([0.00001, 0.00009, 1e-7, 1.234567e-7, 9.999999e-7])(
    "preserves the plain neutral fallback when a historical rate truncates to zero (%s)",
    (previous) => {
      const currentCurrencies = [
        {
          data: { ...currencies[0].data, EUR: { code: "EUR", value: 0.0001 } },
        },
      ];

      const content = widgetCurrencyRender(
        currentCurrencies,
        [{ data: { EUR: { value: previous } } }],
        "EUR",
      );

      expect(content).toContain('currency--percentage neutral">0.00%</div>');
      expect(content).not.toContain("<svg");
    },
  );

  test("renders a tiny exponential rate as zero with neutral unavailable history", () => {
    const tinyRate = 1.234567e-7;
    const currentCurrencies = [
      {
        data: { ...currencies[0].data, EUR: { code: "EUR", value: tinyRate } },
      },
    ];

    const content = widgetCurrencyRender(
      currentCurrencies,
      [{ data: { EUR: { value: tinyRate } } }],
      "EUR",
    );

    expect(content).toContain('id="rate" class="flex currency--rate">0<');
    expect(content).toContain('currency--percentage neutral">0.00%</div>');
    expect(content).not.toContain("<svg");
    expect(currentCurrencies[0].data.EUR.value).toBe(tinyRate);
  });

  test("renders a tiny current rate as zero with a negative full change", () => {
    const currentCurrencies = [
      {
        data: {
          ...currencies[0].data,
          EUR: { code: "EUR", value: 1.234567e-7 },
        },
      },
    ];

    const content = widgetCurrencyRender(
      currentCurrencies,
      [{ data: { EUR: { value: 0.0001 } } }],
      "EUR",
    );

    expect(content).toContain('id="rate" class="flex currency--rate">0<');
    expect(content).toContain("currency--percentage negative");
    expect(content).toContain("100%");
    expect(content).toContain(downArrow);
  });

  test("retains the exponent when rendering a large rate and its change", () => {
    const currentCurrencies = [
      {
        data: { ...currencies[0].data, EUR: { code: "EUR", value: 1.23e21 } },
      },
    ];

    const content = widgetCurrencyRender(
      currentCurrencies,
      [{ data: { EUR: { value: 1.23e22 } } }],
      "EUR",
    );

    expect(content).toContain(
      'id="rate" class="flex currency--rate">1.23e+21<',
    );
    expect(content).toContain("currency--percentage negative");
    expect(content).toContain("90%");
    expect(content).toContain(downArrow);
  });

  test("preserves a long rate's exponent without changing the percentage calculation", () => {
    const rate = 1.234567e21;
    const currentCurrencies = [
      { data: { ...currencies[0].data, EUR: { code: "EUR", value: rate } } },
    ];
    const history = [{ data: { EUR: { value: rate * 2 } } }];

    const content = widgetCurrencyRender(currentCurrencies, history, "EUR");

    expect(content).toContain(
      'id="rate" class="flex currency--rate">1.234e+21<',
    );
    expect(content).toContain("currency--percentage negative");
    expect(content).toContain("50%");
    expect(content).toContain(downArrow);
    expect(currentCurrencies[0].data.EUR.value).toBe(rate);
    expect(history[0].data.EUR.value).toBe(rate * 2);
  });

  test.each([
    [44.9776059592, 44.9776084585],
    [44.9776084585, 44.9776059592],
  ])(
    "renders identical displayed rates with a neutral zero (%s -> %s)",
    (previous, current) => {
      const currentCurrencies = [
        {
          data: {
            ...currencies[0].data,
            UAH: { code: "UAH", value: current },
          },
        },
      ];
      const history = [{ data: { UAH: { code: "UAH", value: previous } } }];

      const content = widgetCurrencyRender(currentCurrencies, history);

      expect(content).toContain(
        'id="rate" class="flex currency--rate">44.9776<',
      );
      expect(content).toContain("currency--percentage neutral");
      expect(content).toContain("0.00%");
      expect(content).toContain('d=""');
      expect(currentCurrencies[0].data.UAH.value).toBe(current);
      expect(history[0].data.UAH.value).toBe(previous);
    },
  );

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
    expect(content).not.toContain("<svg");
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
      expect(content).not.toContain("<svg");
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
