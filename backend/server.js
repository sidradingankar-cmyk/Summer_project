const express = require("express");
const cors = require("cors");
const db = require("./db");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Campus Navigation Backend Running");
});

app.get("/buildings", (req, res) => {
  db.query("SELECT * FROM buildings", (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(result);
    }
  });
});

app.get("/api/routes", async (req, res) => {
  try {
    const { start, end, accessibilityNeeds } = req.query;
    // Proxy request to the Python AI microservice
    const aiResponse = await axios.get("http://localhost:5001/api/plan_route", {
      params: { start, end, accessibility_needs: accessibilityNeeds }
    });
    
    res.json(aiResponse.data);
  } catch (error) {
    console.error("Error communicating with AI module:", error.message);
    res.status(500).json({ error: "Failed to calculate route" });
  }
});

app.listen(5000, () => {
  console.log("Server Running on Port 5000");
});