export function getParsedData(key) {
    const storedData = localStorage.getItem(key);
    return JSON.parse(storedData);
  }
  