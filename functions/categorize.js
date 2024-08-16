import { MongoClient } from "mongodb";
import analyzePayloads from "./analyzePayload.js";
import "dotenv/config";

const mongoUri = `mongodb+srv://eddyguo:${process.env.URI_KEY}@serverlessinstance0.3veuxqs.mongodb.net/?retryWrites=true&w=majority`;

const mongoClient = new MongoClient(mongoUri);

async function categorizeGasData(chain, contract) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db("axelarscan-gmp");
    const collection = db.collection("transactions");

    const match = {
      $match: {
        "executed.chain": chain,
        "executed.receipt.to": contract,
      },
    };

    const group = [
      match,
      {
        $addFields: {
          gasUsedInt: { $toInt: "$executed.receipt.gasUsed" },
        },
      },
      {
        $sort: {
          gasUsedInt: 1,
          _id: 1,
        },
      },
      {
        $group: {
          _id: {
            chain: "$executed.chain",
            contract: "$executed.receipt.to",
          },
          transaction_count: { $sum: 1 },
          average_gas: { $avg: { $toInt: "$executed.receipt.gasUsed" } },
          gas_array: { $push: { $toInt: "$executed.receipt.gasUsed" } },
          transactions: { $push: { $toString: "$call.returnValues.payload" } },
        },
      },
      {
        $project: {
          _id: 0,
          transaction_count: 1,
          average_gas: { $round: ["$average_gas", 0] },
          median: {
            $median: {
              input: "$gas_array",
              method: "approximate",
            },
          },
          sd: {
            $round: [{ $stdDevSamp: "$gas_array" }, 0],
          },
          transactions: 1,
        },
      },
    ];

    const cursor = collection.aggregate(group);
    const data = (await cursor.toArray())[0];

    const transactions = data.transactions;
    const quartileSize = Math.ceil(transactions.length / 4);

    const payload_object = {
      all: transactions,
      low_gas: transactions.slice(0, quartileSize),
      medium_low_gas: transactions.slice(quartileSize, quartileSize * 2),
      medium_high_gas: transactions.slice(quartileSize * 2, quartileSize * 3),
      high_gas: transactions.slice(quartileSize * 3),
    };

    const chunk_frequency = analyzePayloads(payload_object);

    const response = {
      info: { chain, contract, transaction_count: data.transaction_count },
      average: data.average_gas,
      median: data.median,
      standard_deviation: data.sd,
      chunk_frequency,
    };
    return response;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await mongoClient.close();
    console.log("Executed.");
  }
}

export default categorizeGasData;
