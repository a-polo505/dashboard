import express from "express";
import { MongoClient } from "mongodb";
import aj from "../src/utils/arcjet.js";

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;

MongoClient.connect(uri)
  .then((client) => {
    const collection = client.db("yourDatabaseName").collection("currencies");
    const currenciesDiffCollection = client
      .db("yourDatabaseName")
      .collection("currenciesDiff");

    app.get("/api/currencies", aj, async (req, res) => {
      try {
        // const decision = await aj.protect(req);
        // if (decision.isDenied()) {
        //   res.status(403).json({ error: "Forbidden" });
        //   return;
        // }

        const currenciesData = await collection.find({}).toArray();
        const currenciesDiffData = await currenciesDiffCollection
          .find({})
          .toArray();

        const formattedCurrenciesDiffData = currenciesDiffData.map(
          ({ _id, data }) => data,
        );

        res.json({
          currencies: currenciesData,
          currenciesDiff: formattedCurrenciesDiffData,
        });
      } catch (error) {
        console.error("Error retrieving data from the database:", error);
        res.status(500).send("Server error");
      }
    });

    app.listen(port, () => {
      console.log(`The server is running on the port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });
