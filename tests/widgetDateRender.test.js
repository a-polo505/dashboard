import { renderDateContainer } from "../src/utils/widgetDateRender";

test("getCurrentDate returns correct HTML content", () => {
  const expectedHTML = `<div class="flex flex-col h-100 align-center justify-center"><p class="calendar--month">January</p><p class="calendar--day">1</p></div>`;

  const fixedDate = new Date("2024-01-01T00:00:00.000Z");

  jest.spyOn(global, "Date").mockImplementation(() => fixedDate);

  const result = renderDateContainer();

  expect(result).toEqual(expectedHTML);
});
