const express = require("express");
const database = require("../config/database");

const app = express();
const PORT = 3002;

app.use(express.static("public"));

// Database viewer endpoint
app.get("/db/stats", async (req, res) => {
  try {
    await database.connect();
    const stats = await database.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/db/nyc", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await database.getNYCData(null, null, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/db/us", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const state = req.query.state || null;
    const data = await database.getUSData(state, null, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/db/states", async (req, res) => {
  try {
    const states = await database.getAvailableStates();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Air Quality Database Viewer</title></head>
      <body>
        <h1>Air Quality Database Viewer</h1>
        <ul>
          <li><a href="/db/stats">Database Statistics</a></li>
          <li><a href="/db/nyc?limit=10">NYC Data (10 records)</a></li>
          <li><a href="/db/us?limit=10">US Data (10 records)</a></li>
          <li><a href="/db/states">All States</a></li>
          <li><a href="/db/us?state=California&limit=20">California Data</a></li>
        </ul>
      </body>
    </html>
  `);
});

app.listen(PORT, async () => {
  console.log(`🔍 Database viewer running at http://localhost:${PORT}`);
  await database.connect();
});
