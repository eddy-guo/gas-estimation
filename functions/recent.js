import axios from "axios";

const apiUrl = "https://api.gmp.axelarscan.io/";

async function getAverageGas(chain, contract) {
  try {
    const requestData = {
      method: "searchGMP",
      size: 100,
      status: "executed",
      sort: { "call.block_timestamp": "desc" },
      destinationChain: chain,
      destinationContractAddress: contract,
    };

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
      },
    });

    const transactions = response.data.data;
    const totalGasUsed = transactions.reduce((total, transaction) => {
      const gasUsed = transaction.executed?.receipt?.gasUsed;
      if (gasUsed !== undefined) {
        return total + Number(gasUsed);
      } else {
        return total;
      }
    }, 0);
    const averageGas = totalGasUsed / requestData.size;
    return averageGas;
  } catch (error) {
    console.error("Error making the API request:", error);
    throw error;
  }
}

export default getAverageGas;
