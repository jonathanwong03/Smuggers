/*
To run this backend server:
1. Open a terminal in the 'c:\nasa\Smuggers\backend' directory.
2. Run 'npm install' to install the required dependencies (express, cors).
3. Run 'npm run dev' to start the server in development mode.
   The server will listen on http://localhost:3001.
*/

// ===== backend/server.js - Using CSV as Data Source =====

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store parsed CSV data
let csvData = [];

// Location mapping from CSV
const locationMap = {
  '407': 'Flushing and Corona',
  '107': 'Upper West Side',
  '414': 'Rockaway and Broad Channel',
  '307': 'Sunset Park',
  '314': 'Flatbush and Midwood',
  '207': 'Kingsbridge Heights and Bedford',
  '301': 'Washington Heights',
  '201': 'Kingsbridge',
  '101': 'Financial District'
};

// Pollutant types from CSV
const pollutantMap = {
  '375': { name: 'NO2', fullName: 'Nitrogen dioxide', unit: 'ppb' },
  '365': { name: 'PM2.5', fullName: 'Fine particles', unit: 'mcg/m3' }
};

// Parse CSV file
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    
    if (row['Unique ID']) {
      data.push(row);
    }
  }
  
  return data;
}

// Load CSV on server start
function loadCSVData() {
  try {
    const csvPath = path.join(__dirname, 'data', 'Air_Quality.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    csvData = parseCSV(csvText);
    console.log(`✓ Loaded ${csvData.length} records from CSV`);
    
    // Log unique locations
    const locations = [...new Set(csvData.map(r => r['Geo Join ID']))];
    console.log(`✓ Found ${locations.length} unique locations`);
    
    // Log unique pollutants
    const pollutants = [...new Set(csvData.map(r => r['Name']))];
    console.log(`✓ Found ${pollutants.length} unique pollutants`);
    
    return true;
  } catch (error) {
    console.error('❌ Error loading CSV:', error.message);
    console.log('Creating sample data instead...');
    csvData = createSampleData();
    return false;
  }
}

// Create sample data if CSV not found
function createSampleData() {
  const locations = ['407', '107', '414', '307'];
  const data = [];
  
  for (let i = 0; i < 50; i++) {
    data.push({
      'Unique ID': `${100000 + i}`,
      'Indicator ID': Math.random() > 0.5 ? '375' : '365',
      'Name': Math.random() > 0.5 ? 'Nitrogen dioxide Mean' : 'Fine particles Mean',
      'Measure': Math.random() > 0.5 ? 'ppb' : 'mcg/m3',
      'Geo Join ID': locations[Math.floor(Math.random() * locations.length)],
      'Geo Place Name': 'New York City',
      'Time Period': '2024',
      'Start_Date': '2024-01-01',
      'Data Value': (Math.random() * 50 + 20).toFixed(2)
    });
  }
  
  return data;
}

// Calculate AQI from pollutant values
function calculateAQI(no2Value, pm25Value) {
  // Simplified AQI calculation
  // NO2: Good < 53 ppb, Moderate 54-100, Unhealthy > 100
  // PM2.5: Good < 12, Moderate 12-35.4, Unhealthy > 35.4
  
  let aqi = 50; // Default good
  
  if (pm25Value) {
    const pm25 = parseFloat(pm25Value);
    if (pm25 <= 12.0) aqi = Math.round((50 / 12.0) * pm25);
    else if (pm25 <= 35.4) aqi = Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    else if (pm25 <= 55.4) aqi = Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    else aqi = 150;
  }
  
  if (no2Value) {
    const no2 = parseFloat(no2Value);
    const no2AQI = Math.min(150, Math.round(no2 * 1.5));
    aqi = Math.max(aqi, no2AQI);
  }
  
  return Math.round(aqi);
}

// Get AQI category
function getAQICategory(aqi) {
  if (aqi <= 50) return { level: 'Good', color: '#00e400' };
  if (aqi <= 100) return { level: 'Moderate', color: '#ffff00' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#ff7e00' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#ff0000' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8f3f97' };
  return { level: 'Hazardous', color: '#7e0023' };
}

// Get latest data for a location
function getLocationData(geoId) {
  const locationRecords = csvData
    .filter(record => record['Geo Join ID'] === geoId)
    .sort((a, b) => new Date(b['Start_Date']) - new Date(a['Start_Date']));
  
  if (locationRecords.length === 0) return null;
  
  // Get latest NO2 and PM2.5 values
  const latestNO2 = locationRecords.find(r => r['Name'] && r['Name'].includes('Nitrogen dioxide'));
  const latestPM25 = locationRecords.find(r => r['Name'] && r['Name'].includes('Fine particles'));
  const latestO3 = locationRecords.find(r => r['Name'] && r['Name'].includes('Ozone'));
  
  return {
    no2: latestNO2 ? parseFloat(latestNO2['Data Value']) : null,
    pm25: latestPM25 ? parseFloat(latestPM25['Data Value']) : null,
    o3: latestO3 ? parseFloat(latestO3['Data Value']) : null,
    location: locationRecords[0]['Geo Place Name'] || locationMap[geoId] || `Location ${geoId}`,
    geoId: geoId,
    lastUpdated: locationRecords[0]['Start_Date']
  };
}

// Get location by coordinates (approximate matching)
function getLocationByCoords(lat, lng) {
  // Simple mapping of coordinates to NYC areas
  const coordMap = {
    '40.7128,-74.0060': '107', // Manhattan (default NYC coords)
    '40.7589,-73.9851': '107', // Times Square area
    '40.7829,-73.9654': '107', // Central Park
    '40.7282,-73.7949': '407', // Queens
    '40.6413,-73.7781': '407', // JFK area
    '40.8448,-73.8648': '201', // Bronx
    '40.6892,-73.9442': '314', // Brooklyn
    '40.5795,-74.1502': '414'  // Staten Island
  };
  
  const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  return coordMap[coordKey] || '107'; // Default to Manhattan
}

// ============================================
// API ROUTES
// ============================================

// Main endpoint - matches your frontend
app.get('/api/air-quality', (req, res) => {
  try {
    console.log('📊 Air quality data requested from CSV');
    
    // Get location from query parameters
    let geoId;
    if (req.query.lat && req.query.lng) {
      geoId = getLocationByCoords(parseFloat(req.query.lat), parseFloat(req.query.lng));
    } else {
      geoId = req.query.location || '107'; // Default to Manhattan
    }
    
    // Get data from CSV
    const data = getLocationData(geoId);
    
    if (!data) {
      return res.status(404).json({
        error: 'No data found for this location',
        availableLocations: Object.keys(locationMap)
      });
    }
    
    // Calculate AQI
    const aqi = calculateAQI(data.no2, data.pm25);
    const category = getAQICategory(aqi);
    
    // Format response for your frontend
    const response = {
      location: data.location,
      aqi: aqi,
      pollutants: [
        { name: "NO2", value: data.no2 || 0 },
        { name: "PM2.5", value: data.pm25 || 0 },
        { name: "O3", value: data.o3 || Math.random() * 0.1 },
        { name: "SO2", value: Math.random() * 0.02 },
        { name: "PM10", value: (data.pm25 || 0) * 1.5 },
        { name: "CO", value: Math.random() * 2 }
      ],
      weather: {
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        windSpeed: Math.random() * 20,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        pressure: 1013 + Math.random() * 20 - 10,
        visibility: 8 + Math.random() * 4
      },
      category: category,
      primaryPollutant: data.pm25 > (data.no2 || 0) / 2 ? 'PM2.5' : 'NO2',
      lastUpdated: data.lastUpdated,
      timestamp: new Date().toISOString(),
      source: 'NYC Air Quality Historical Data',
      trend: Math.random() > 0.5 ? (Math.random() > 0.5 ? 1 : -1) : 0
    };
    
    console.log(`✓ Sent data for ${data.location} - AQI: ${aqi}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality data',
      message: error.message 
    });
  }
});

// Forecast endpoint for frontend
app.get('/api/forecast', (req, res) => {
  try {
    console.log('📈 Forecast data requested');
    
    // Get location from query parameters
    let geoId;
    if (req.query.lat && req.query.lng) {
      geoId = getLocationByCoords(parseFloat(req.query.lat), parseFloat(req.query.lng));
    } else {
      geoId = req.query.location || '107';
    }
    
    const hours = parseInt(req.query.hours) || 24;
    const data = getLocationData(geoId);
    
    if (!data) {
      return res.status(404).json({
        error: 'No data found for this location'
      });
    }
    
    // Generate forecast based on historical data with some variation
    const baseAqi = calculateAQI(data.no2, data.pm25);
    const forecast = [];
    
    for (let i = 0; i < hours; i++) {
      const time = new Date();
      time.setHours(time.getHours() + i);
      
      // Add some realistic variation based on time of day
      const hourOfDay = time.getHours();
      let variation = 0;
      
      // Higher pollution during rush hours (7-9 AM, 5-7 PM)
      if ((hourOfDay >= 7 && hourOfDay <= 9) || (hourOfDay >= 17 && hourOfDay <= 19)) {
        variation = 10 + Math.random() * 15;
      } else if (hourOfDay >= 22 || hourOfDay <= 5) {
        // Lower pollution at night
        variation = -10 - Math.random() * 10;
      } else {
        variation = Math.random() * 20 - 10;
      }
      
      const forecastAqi = Math.max(10, Math.min(200, Math.round(baseAqi + variation)));
      
      forecast.push({
        time: time.toISOString(),
        aqi: forecastAqi,
        temperature: 20 + Math.sin(i * 0.2) * 10 + Math.random() * 5,
        humidity: 50 + Math.cos(i * 0.15) * 20 + Math.random() * 10
      });
    }
    
    res.json(forecast);
    
  } catch (error) {
    console.error('❌ Forecast Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch forecast data',
      message: error.message 
    });
  }
});

// Get all available locations
app.get('/api/locations', (req, res) => {
  const locations = [...new Set(csvData.map(r => r['Geo Join ID']))]
    .map(id => ({
      id: id,
      name: locationMap[id] || `Location ${id}`,
      dataPoints: csvData.filter(r => r['Geo Join ID'] === id).length
    }))
    .filter(loc => loc.dataPoints > 0);
  
  res.json({
    success: true,
    count: locations.length,
    locations: locations
  });
});

// Get historical data for a location
app.get('/api/historical/:geoId', (req, res) => {
  const geoId = req.params.geoId;
  
  const locationData = csvData
    .filter(record => record['Geo Join ID'] === geoId)
    .sort((a, b) => new Date(a['Start_Date']) - new Date(b['Start_Date']))
    .map(record => ({
      date: record['Start_Date'],
      pollutant: pollutantMap[record['Indicator ID']]?.name || record['Name'],
      value: parseFloat(record['Data Value']),
      unit: record['Measure'],
      period: record['Time Period']
    }));
  
  res.json({
    success: true,
    location: locationMap[geoId] || `Location ${geoId}`,
    count: locationData.length,
    data: locationData
  });
});

// Get trends for a location
app.get('/api/trends/:geoId', (req, res) => {
  const geoId = req.params.geoId;
  const indicatorId = req.query.pollutant || '375'; // Default to NO2
  
  const trends = csvData
    .filter(r => r['Geo Join ID'] === geoId && r['Indicator ID'] === indicatorId)
    .sort((a, b) => new Date(a['Start_Date']) - new Date(b['Start_Date']))
    .map(record => ({
      date: record['Start_Date'],
      value: parseFloat(record['Data Value']),
      period: record['Time Period']
    }));
  
  res.json({
    success: true,
    location: locationMap[geoId] || `Location ${geoId}`,
    pollutant: pollutantMap[indicatorId]?.fullName || 'Unknown',
    trends: trends
  });
});

// Compare multiple locations
app.get('/api/compare', (req, res) => {
  const locations = req.query.locations?.split(',') || ['407', '107', '414'];
  
  const comparison = locations.map(geoId => {
    const data = getLocationData(geoId);
    if (!data) return null;
    
    const aqi = calculateAQI(data.no2, data.pm25);
    
    return {
      location: data.location,
      geoId: geoId,
      aqi: aqi,
      category: getAQICategory(aqi),
      no2: data.no2,
      pm25: data.pm25
    };
  }).filter(Boolean);
  
  res.json({
    success: true,
    comparison: comparison
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    dataSource: 'CSV File',
    recordsLoaded: csvData.length,
    locations: [...new Set(csvData.map(r => r['Geo Join ID']))].length,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Air Quality API (CSV Data)',
    version: '1.0.0',
    dataSource: 'Historical CSV Records',
    recordCount: csvData.length,
    endpoints: {
      main: '/api/air-quality?location=407',
      locations: '/api/locations',
      historical: '/api/historical/:geoId',
      trends: '/api/trends/:geoId?pollutant=375',
      compare: '/api/compare?locations=407,107,414',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      '/api/air-quality',
      '/api/locations',
      '/api/historical/:geoId',
      '/api/trends/:geoId',
      '/api/compare',
      '/api/health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('\n===========================================');
  console.log('  🌍 Air Quality API (CSV Data Source)');
  console.log('===========================================');
  console.log(`✓ Server: http://localhost:${PORT}`);
  console.log(`✓ Health: http://localhost:${PORT}/api/health`);
  console.log(`✓ API: http://localhost:${PORT}/api/air-quality`);
  console.log('===========================================\n');
  
  // Load CSV data
  loadCSVData();
  
  console.log('📊 Server ready!\n');
});