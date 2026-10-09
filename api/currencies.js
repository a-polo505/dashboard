import express from "express";
import { MongoClient } from "mongodb";

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;

MongoClient.connect(uri)
  .then((client) => {
    const collection = client.db("yourDatabaseName").collection("currencies");
    const currenciesDiffCollection = client
      .db("yourDatabaseName")
      .collection("currenciesDiff");

    app.get("/api/currencies", async (req, res) => {
      let session;
      let responseData;
      let operationFailed = false;
      let operationError;
      try {
        session = client.startSession();
        session.startTransaction({
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          readPreference: "primary",
        });

        const currenciesData = await collection
          .find({}, { session })
          .limit(2)
          .toArray();
        const currenciesDiffData = await currenciesDiffCollection
          .find({}, { session })
          .limit(2)
          .toArray();

        if (currenciesData.length > 1 || currenciesDiffData.length > 1) {
          throw new Error(
            "Expected at most one document per currency collection",
          );
        }

        const formattedCurrenciesDiffData = currenciesDiffData.map(
          ({ _id, data }) => data,
        );

        responseData = {
          currencies: currenciesData,
          currenciesDiff: formattedCurrenciesDiffData,
        };
        await session.commitTransaction();
      } catch (error) {
        operationFailed = true;
        operationError = error;
        if (session?.inTransaction()) {
          try {
            await session.abortTransaction();
          } catch {
            console.error(
              "Error aborting MongoDB read transaction after a failed operation",
            );
          }
        }
      } finally {
        if (session) {
          try {
            await session.endSession();
          } catch (error) {
            if (operationFailed) {
              console.error(
                "Error ending MongoDB read session after a failed operation",
              );
            } else {
              operationFailed = true;
              operationError = error;
            }
          }
        }
      }

      if (operationFailed) {
        console.error(
          "Error retrieving data from the database:",
          operationError,
        );
        res.status(500).send("Server error");
        return;
      }
      res.json(responseData);
    });

    app.listen(port, () => {
      console.log(`The server is running on the port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });
