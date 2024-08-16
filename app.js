import express from "express";
import processGasData from "./functions/process.js";
import categorizeGasData from "./functions/categorize.js";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/gas-data", async (req, res) => {
  const { chain, contract } = req.query;

  if (!chain || !contract) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const gasData = await processGasData(chain, contract);
    if (!gasData) {
      return res.status(404).json({ error: "Gas data not found" });
    }
    res.json(gasData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/payload", async (req, res) => {
  const { chain, contract } = req.query;

  if (!chain || !contract) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const response = await categorizeGasData(chain, contract);
    if (!response) {
      return res.status(404).json({ error: "Data not found" });
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
