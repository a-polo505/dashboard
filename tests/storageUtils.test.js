import { getParsedData } from "../src/utils/storageUtils";
import "jest-localstorage-mock";

describe("getParsedData function", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("should return parsed data when key exists in sessionStorage", () => {
    const key = "currencies";
    const data = { code: "UAH", value: 38 };
    sessionStorage.setItem(key, JSON.stringify(data));

    const result = getParsedData(key);
    expect(result).toEqual(data);
  });

  test("should return null when key does not exist in sessionStorage", () => {
    const key = "nonExistentKey";

    const result = getParsedData(key);
    expect(result).toBeNull();
  });
});
