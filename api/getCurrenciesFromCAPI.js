import fetch from "node-fetch";

export async function getCurrencies() {
  const apiKey = process.env.CURRENCYAPI_API_KEY;
  const apiUrl = process.env.CURRENCYAPI_API_URL;

  const response = await fetch(`${apiUrl}?apikey=${apiKey}`);
  const data = await response.json();

  return data.data;
}
