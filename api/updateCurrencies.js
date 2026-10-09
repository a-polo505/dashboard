import { isValidToken } from "./auth.js";
import { getCurrencies } from "./getCurrenciesFromCAPI.js";
import { sendCurrenciesToMongoDB } from "./mongoHandler.js";

export default async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const requestToken = req.headers?.authorization;

    if (!isValidToken(requestToken)) {
      res.setHeader("WWW-Authenticate", "Bearer");
      res.status(401).send("Unauthorized");
      return;
    }

    const currencies = await getCurrencies();

    await sendCurrenciesToMongoDB(currencies);

    res
      .status(200)
      .send(`Available currencies: ${Object.keys(currencies).join(", ")}`);
  } catch (error) {
    console.error("Error fetching and formatting data:", error);
    res.status(500).send("Internal Server Error");
  }
};
