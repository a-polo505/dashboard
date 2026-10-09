import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export async function sendCurrenciesToMongoDB(currencies) {
  const client = new MongoClient(uri);
  let session;
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

    session = client.startSession();
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });

    const currentDocuments = await collection
      .find({}, { session })
      .limit(2)
      .toArray();
    const previousDocuments = await diffCollection
      .find({}, { session })
      .limit(2)
      .toArray();

    if (currentDocuments.length > 1 || previousDocuments.length > 1) {
      throw new Error("Expected at most one document per currency collection");
    }

    const currentDocument = currentDocuments[0];
    const previousDocument = previousDocuments[0];
    await diffCollection.replaceOne(
      { _id: previousDocument ? previousDocument._id : "latest" },
      { data: currentDocument ?? null, ...lastUpdate },
      { upsert: true, session },
    );

    await collection.updateOne(
      { _id: currentDocument ? currentDocument._id : "latest" },
      { $set: { data: filteredCurrencies, ...lastUpdate } },
      { upsert: true, session },
    );

    await session.commitTransaction();
  } catch (error) {
    operationFailed = true;
    operationError = error;
    if (session?.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch {
        console.error(
          "Error aborting MongoDB transaction after a failed operation",
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
            "Error ending MongoDB session after a failed operation",
          );
        } else {
          operationFailed = true;
          operationError = error;
        }
      }
    }
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
