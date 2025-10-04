require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  tempoApiKey: process.env.TEMPO_API_KEY || 'DEMO_KEY',
  weatherApiKey: process.env.WEATHER_API_KEY,
  groundStationUrl: process.env.GROUND_STATION_API_URL || 'https://api.example.com',
  updateInterval: parseInt(process.env.UPDATE_INTERVAL_MINUTES) || 30,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  defaultLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    stationId: 'nyc_001'
  }
};
