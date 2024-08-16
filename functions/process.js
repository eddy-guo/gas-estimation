import { MongoClient } from "mongodb";
import getAverageGas from "./recent.js";
import "dotenv/config";

const mongoUri = `mongodb+srv://eddyguo:${process.env.URI_KEY}@serverlessinstance0.3veuxqs.mongodb.net/?retryWrites=true&w=majority`;

const mongoClient = new MongoClient(mongoUri);

async function processGasData(chain, contract) {
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
        $group: {
          _id: {
            chain: "$executed.chain",
            contract: "$executed.receipt.to",
          },
          transaction_count: { $sum: 1 },
          average_gas: { $avg: { $toInt: "$executed.receipt.gasUsed" } },
          payload: { $push: "$call.returnValues.payload" },
          gas_array: { $push: { $toInt: "$executed.receipt.gasUsed" } },
        },
      },
      {
        $project: {
          _id: 0,
          transaction_count: 1,
          average_gas: { $round: ["$average_gas", 0] },
        },
      },
    ];

    const cursor = collection.aggregate(group);
    const data = (await cursor.toArray())[0];

    const recent_average_gas = Math.round(await getAverageGas(chain, contract));

    const response = {
      info: { chain, contract, transaction_count: data.transaction_count },
      average: data.average_gas,
      recent_average: recent_average_gas,
      average_profit: {
        "0%": Math.round(data.average_gas - recent_average_gas),
        "3%": Math.round(data.average_gas * 1.03 - recent_average_gas),
        "5%": Math.round(data.average_gas * 1.05 - recent_average_gas),
        "8%": Math.round(data.average_gas * 1.08 - recent_average_gas),
        "10%": Math.round(data.average_gas * 1.1 - recent_average_gas),
      },
    };
    return response;
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoClient.close();
    console.log("Executed.");
  }
}

export default processGasData;
