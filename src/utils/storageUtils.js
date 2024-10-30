export function getParsedData(key) {
  const storedData = sessionStorage.getItem(key);
  return JSON.parse(storedData);
}
