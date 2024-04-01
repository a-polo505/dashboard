import { truncateDecimals } from "../src/utils/widgetCurrencyRender";

describe('truncateDecimals function', () => {
    test('should truncate decimals correctly', () => {
        const number = 10.123456789;
        const digits = 4;
        const expected = 10.1234;

        const result = truncateDecimals(number, digits);

        expect(result.toFixed(digits)).toEqual(expected.toFixed(digits));
    });

    test('should return the same number when no decimals are truncated', () => {
        const number = 10;
        const digits = 4;
        const expected = 10;

        const result = truncateDecimals(number, digits);

        expect(result).toEqual(expected);
    });

    test('should handle negative numbers correctly', () => {
        const number = -10.123456789;
        const digits = 4;
        const expected = -10.1234;

        const result = truncateDecimals(number, digits);

        expect(result.toFixed(digits)).toEqual(expected.toFixed(digits));
    });
});

