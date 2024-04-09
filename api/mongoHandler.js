import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export async function sendCurrenciesToMongoDB(currencies) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const collection = client.db("yourDatabaseName").collection("currencies");
    const diffCollection = client
      .db("yourDatabaseName")
      .collection("currenciesDiff");

    const filteredCurrencies = {};
    for (const key in currencies) {
      if (key !== "RUB") {
        filteredCurrencies[key] = currencies[key];
      }
    }

    await diffCollection.replaceOne(
      {},
      { data: await collection.findOne({}) },
      { upsert: true },
    );

    await collection.updateOne(
      {},
      { $set: { data: filteredCurrencies } },
      { upsert: true },
    );
  } catch (error) {
    console.error("Error saving request data:", error);
  } finally {
    await client.close();
  }
}
