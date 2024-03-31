import { getParsedData } from "../src/utils/storageUtils";
import 'jest-localstorage-mock';

describe('getParsedData function', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('should return parsed data when key exists in localStorage', () => {
        const key = 'currencies';
        const data = { code: 'UAH', value: 38 };
        localStorage.setItem(key, JSON.stringify(data));
        
        const result = getParsedData(key);
        expect(result).toEqual(data);
    });

    test('should return null when key does not exist in localStorage', () => {
        const key = 'nonExistentKey';
        
        const result = getParsedData(key);
        expect(result).toBeNull();
    });
});