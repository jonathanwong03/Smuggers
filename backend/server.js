/*
To run this backend server:
1. Open a terminal in the 'c:\nasa\Smuggers\backend' directory.
2. Run 'npm install' to install the required dependencies (express, cors).
3. Run 'npm run dev' to start the server in development mode.
   The server will listen on http://localhost:3001.
*/

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Placeholder for real data integration
const getAirQualityData = () => {
  // In a real application, you would fetch this from NASA TEMPO,
  // ground stations, and weather APIs.
  return {
    location: "New York, NY",
    aqi: Math.floor(Math.random() * 150) + 20, // Simulated AQI
    pollutants: [
      { name: "O3", value: Math.random() * 0.1 },
      { name: "NO2", value: Math.random() * 0.05 },
      { name: "SO2", value: Math.random() * 0.02 },
    ],
    forecast: [
      { day: "Tomorrow", aqi: Math.floor(Math.random() * 150) + 20 },
      { day: "Day after tomorrow", aqi: Math.floor(Math.random() * 150) + 20 },
    ],
    timestamp: new Date().toISOString(),
  };
};

app.get('/api/air-quality', (req, res) => {
  const data = getAirQualityData();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
