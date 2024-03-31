import { getCurrentDate } from "../src/utils/widgetDateRender";

test('getCurrentDate returns correct HTML content', () => {
    const expectedHTML = `<div class="flex flex-col h-100 align-center justify-center"><p class="calendar--month">March</p><p class="calendar--day">31</p></div>`;
    
    // Передаємо функції getCurrentDate() фіксовану дату (березня 31) для стабільних результатів
    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2024-03-31T00:00:00.000Z'));
  
    const result = getCurrentDate();
  
    expect(result).toEqual(expectedHTML);
  });