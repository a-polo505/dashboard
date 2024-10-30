export function getParsedData(key) {
  const storedData = sessionStorage.getItem(key);
  try {
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}
