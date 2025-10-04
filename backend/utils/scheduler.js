const cron = require('node-cron');
const dataFetcher = require('../services/dataFetcher');
const dataProcessor = require('../services/dataProcessor');
const forecastEngine = require('../services/forecastEngine');
const config = require('../config/config');

let isUpdating = false;

async function updateAirQualityData() {
  if (isUpdating) {
    return;
  }

  isUpdating = true;
  try {
    const rawData = await dataFetcher.fetchAllData(
      config.defaultLocation.latitude,
      config.defaultLocation.longitude,
      config.defaultLocation.stationId
    );

    const normalizedData = dataProcessor.normalizeData(rawData);
    
    if (normalizedData) {
      forecastEngine.addHistoricalData(normalizedData);
      console.log(`[${new Date().toLocaleTimeString()}] Data updated. AQI: ${normalizedData.aqi}`);
      
      if (forecastEngine.historicalData.length % 50 === 0 && forecastEngine.historicalData.length >= 50) {
        await forecastEngine.trainModel();
      }
    }
  } catch (error) {
    console.error('Update error:', error.message);
  } finally {
    isUpdating = false;
  }
}

function startScheduler() {
  forecastEngine.initializeModel();
  updateAirQualityData();
  
  cron.schedule(`*/${config.updateInterval} * * * *`, updateAirQualityData);
  
  console.log(`✓ Scheduler started (updates every ${config.updateInterval} minutes)`);
}

module.exports = { startScheduler, updateAirQualityData };