const express = require('express');
const router = express.Router();
const dataFetcher = require('../services/dataFetcher');
const dataProcessor = require('../services/dataProcessor');
const forecastEngine = require('../services/forecastEngine');
const config = require('../config/config');

// Original endpoint - matches your existing API
router.get('/air-quality', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || config.defaultLocation.latitude;
    const lon = parseFloat(req.query.lon) || config.defaultLocation.longitude;
    const stationId = req.query.stationId || config.defaultLocation.stationId;

    const rawData = await dataFetcher.fetchAllData(lat, lon, stationId);
    const normalizedData = dataProcessor.normalizeData(rawData);

    if (!normalizedData) {
      return res.status(503).json({
        error: 'Unable to fetch air quality data'
      });
    }

    const response = {
      location: dataProcessor.getLocationName(lat, lon),
      aqi: normalizedData.aqi,
      pollutants: [
        { name: "O3", value: normalizedData.o3 },
        { name: "NO2", value: normalizedData.no2 },
        { name: "SO2", value: normalizedData.so2 },
        { name: "PM2.5", value: normalizedData.pm25 },
        { name: "PM10", value: normalizedData.pm10 }
      ],
      forecast: [
        { day: "Tomorrow", aqi: Math.round(normalizedData.aqi * (0.95 + Math.random() * 0.1)) },
        { day: "Day after tomorrow", aqi: Math.round(normalizedData.aqi * (0.9 + Math.random() * 0.2)) }
      ],
      weather: {
        temperature: normalizedData.temperature,
        humidity: normalizedData.humidity,
        windSpeed: normalizedData.windSpeed
      },
      category: dataProcessor.getAQICategory(normalizedData.aqi),
      timestamp: normalizedData.timestamp
    };

    res.json(response);
  } catch (error) {
    console.error('Air quality error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Enhanced endpoints
router.get('/airquality/current', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || config.defaultLocation.latitude;
    const lon = parseFloat(req.query.lon) || config.defaultLocation.longitude;
    const stationId = req.query.stationId || config.defaultLocation.stationId;

    const rawData = await dataFetcher.fetchAllData(lat, lon, stationId);
    const normalizedData = dataProcessor.normalizeData(rawData);

    if (!normalizedData) {
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch air quality data'
      });
    }

    res.json({
      success: true,
      data: {
        aqi: normalizedData.aqi,
        category: dataProcessor.getAQICategory(normalizedData.aqi),
        pollutants: {
          pm25: normalizedData.pm25,
          pm10: normalizedData.pm10,
          no2: normalizedData.no2,
          o3: normalizedData.o3,
          so2: normalizedData.so2
        },
        weather: {
          temperature: normalizedData.temperature,
          humidity: normalizedData.humidity,
          windSpeed: normalizedData.windSpeed,
          pressure: normalizedData.pressure
        },
        location: { 
          latitude: lat, 
          longitude: lon,
          name: dataProcessor.getLocationName(lat, lon)
        },
        timestamp: normalizedData.timestamp
      }
    });
  } catch (error) {
    console.error('Current AQ error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/airquality/forecast', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || config.defaultLocation.latitude;
    const lon = parseFloat(req.query.lon) || config.defaultLocation.longitude;
    const stationId = req.query.stationId || config.defaultLocation.stationId;

    const rawData = await dataFetcher.fetchAllData(lat, lon, stationId);
    const forecasts = await forecastEngine.predict(rawData);

    res.json({
      success: true,
      data: forecasts,
      location: { 
        latitude: lat, 
        longitude: lon,
        name: dataProcessor.getLocationName(lat, lon)
      }
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unable to generate forecast'
    });
  }
});

router.get('/airquality/historical', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const historical = forecastEngine.historicalData
      .slice(-limit)
      .map(record => ({
        aqi: record.aqi,
        category: dataProcessor.getAQICategory(record.aqi),
        timestamp: record.timestamp
      }));

    res.json({
      success: true,
      data: historical,
      count: historical.length
    });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve historical data'
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    model: {
      initialized: forecastEngine.model !== null,
      dataPoints: forecastEngine.historicalData.length,
      ready: forecastEngine.historicalData.length >= 50
    }
  });
});

module.exports = router;