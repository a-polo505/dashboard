import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export async function sendCurrenciesToMongoDB(currencies) {
  const client = new MongoClient(uri);
  let operationFailed = false;
  let operationError;

  try {
    await client.connect();
    const collection = client.db("yourDatabaseName").collection("currencies");
    const diffCollection = client
      .db("yourDatabaseName")
      .collection("currenciesDiff");

    const filteredCurrencies = {};
    for (const key in currencies) {
      if (key !== "RUB" && key !== "BYN") {
        filteredCurrencies[key] = currencies[key];
      }
    }

    const currentDate = new Date();
    const lastUpdate = { lastUpdated: currentDate };

    await diffCollection.replaceOne(
      {},
      { data: await collection.findOne({}), ...lastUpdate },
      { upsert: true },
    );

    await collection.updateOne(
      {},
      { $set: { data: filteredCurrencies, ...lastUpdate } },
      { upsert: true },
    );
  } catch (error) {
    operationFailed = true;
    operationError = error;
  } finally {
    try {
      await client.close();
    } catch (error) {
      if (operationFailed) {
        // Preserve the operation error instead of replacing it with cleanup failure.
        console.error(
          "Error closing MongoDB connection after a failed operation",
        );
      } else {
        operationFailed = true;
        operationError = error;
      }
    }
  }

  if (operationFailed) {
    throw operationError;
  }
}
