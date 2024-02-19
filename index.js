const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Custom CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); // Replace with your frontend URL
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API keys for GoDaddy and Name.com
const godaddyApiKey = process.env.godaddyApiKey;
const namecomApiKey = process.env.namecomApiKey;


app.get("/", (req, res) => {
  res.send("Welcome to the Double Check API");
});

// API endpoint to compare domain names
app.post("/compare", async (req, res) => {
  try {
    const domainName = req.body.domainName;

    // GoDaddy API
    const godaddyResponse = await axios.get(
      `https://api.ote-godaddy.com/v1/domains/available?domain=${domainName}&checkType=FAST&forTransfer=false`,
      { headers: { Authorization: `sso-key ${godaddyApiKey}` } }
    );

    const godaddyAvailability = godaddyResponse.data.available;
    const godaddyPrice = godaddyResponse.data.price/1000000;

    // Name.com API
    const namecomResponse = await axios.post(
      "https://api.dev.name.com/v4/domains:search",
      { keyword: domainName },
      { headers: { Authorization: `Basic ${namecomApiKey}` } }
    );
    const namecomAvailability = namecomResponse.data.results[0].purchasable;
    const namecomPrice = namecomResponse.data.results[0].purchasePrice;

    // Compare prices and determine the cheaper option
    // let cheaperOption = godaddyPrice < namecomPrice ? "GoDaddy" : "Name.com";

    // Prepare response JSON
    const response = [
      {
        name: "GoDaddy",
        domain: godaddyResponse.data.domain,
        available: godaddyAvailability,
        price: godaddyPrice,
        cheaperOption: godaddyPrice < namecomPrice ? true : false,
      },
      {
        name: "Name.com",
        domain: namecomResponse.data.results[0].domainName,
        available: namecomAvailability,
        price: namecomPrice,
        cheaperOption: namecomPrice < godaddyPrice ? true : false,
      },
    ];

    // Send response
    res.json(response);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
