import { truncateText } from "../src/utils/widgetCurrencyRender";

describe('truncateText function', () => {
    test('should truncate text correctly', () => {
        const text = "38.1234567890";
        const maxLength = 9;
        const expected = "38.123456"; 

        const result = truncateText(text, maxLength);

        expect(result).toBe(expected);
    });

    test('should not truncate text if it is shorter than maxLength', () => {
        const text = "1.1234";
        const maxLength = 9;

        const result = truncateText(text, maxLength);

        expect(result).toBe(text);
    });

    test('should handle text ending with a period correctly', () => {
        const text = "12345678.9";
        const maxLength = 9;
        const expected = "12345678";

        const result = truncateText(text, maxLength);

        expect(result).toBe(expected);
    });
});
