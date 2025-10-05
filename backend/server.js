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
const dataFetcher = require('./services/dataFetcher');

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

// Store both datasets
let nycData = [];
let usData = [];

// Load CSV data on server start
function loadCSVData() {
  let success = true;
  
  // Load NYC data
  try {
    const nycPath = path.join(__dirname, 'data', 'Air_Quality.csv');
    const nycText = fs.readFileSync(nycPath, 'utf-8');
    nycData = parseCSV(nycText);
    console.log(`✓ Loaded ${nycData.length} NYC records from Air_Quality.csv`);
  } catch (error) {
    console.error('❌ Error loading NYC CSV:', error.message);
    success = false;
  }
  
  // Load US states/counties data
  try {
    const usPath = path.join(__dirname, 'data', 'countries_air_quality_data.csv');
    const usText = fs.readFileSync(usPath, 'utf-8');
    usData = parseCSV(usText);
    console.log(`✓ Loaded ${usData.length} US records from countries_air_quality_data.csv`);
    
    // Log unique states
    const states = [...new Set(usData.map(r => r['StateName']))];
    console.log(`✓ Found ${states.length} unique US states`);
    
    // Log unique measures
    const measures = [...new Set(usData.map(r => r['MeasureName']))];
    console.log(`✓ Found ${measures.length} unique air quality measures`);
    
  } catch (error) {
    console.error('❌ Error loading US CSV:', error.message);
    success = false;
  }
  
  if (!success) {
    console.log('Creating sample data instead...');
    csvData = createSampleData();
  } else {
    csvData = [...nycData, ...usData]; // Combine for backward compatibility
  }
  
  return success;
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
  // Extended mapping including US states
  const coordMap = {
    // NYC areas
    '40.7128,-74.0060': { type: 'nyc', id: '107' },
    '40.7589,-73.9851': { type: 'nyc', id: '107' },
    '40.7829,-73.9654': { type: 'nyc', id: '107' },
    '40.7282,-73.7949': { type: 'nyc', id: '407' },
    '40.6413,-73.7781': { type: 'nyc', id: '407' },
    '40.8448,-73.8648': { type: 'nyc', id: '201' },
    '40.6892,-73.9442': { type: 'nyc', id: '314' },
    '40.5795,-74.1502': { type: 'nyc', id: '414' },
    
    // US States (approximate center coordinates)
    '32.3617,-86.2792': { type: 'state', id: 'Alabama' },
    '64.0685,-152.2782': { type: 'state', id: 'Alaska' },
    '34.2744,-111.2847': { type: 'state', id: 'Arizona' },
    '34.7519,-92.1313': { type: 'state', id: 'Arkansas' },
    '36.7783,-119.4179': { type: 'state', id: 'California' },
    '39.5501,-105.7821': { type: 'state', id: 'Colorado' },
    '41.6032,-73.0877': { type: 'state', id: 'Connecticut' },
    '39.1612,-75.5264': { type: 'state', id: 'Delaware' },
    '27.7663,-82.6404': { type: 'state', id: 'Florida' },
    '32.1656,-82.9001': { type: 'state', id: 'Georgia' },
    '19.8968,-155.5828': { type: 'state', id: 'Hawaii' },
    '44.0682,-114.7420': { type: 'state', id: 'Idaho' },
    '40.6331,-89.3985': { type: 'state', id: 'Illinois' },
    '40.2732,-86.1349': { type: 'state', id: 'Indiana' },
    '41.8780,-93.0977': { type: 'state', id: 'Iowa' },
    '39.0119,-98.4842': { type: 'state', id: 'Kansas' },
    '37.8393,-84.2700': { type: 'state', id: 'Kentucky' },
    '30.9843,-91.9623': { type: 'state', id: 'Louisiana' },
    '45.2538,-69.4455': { type: 'state', id: 'Maine' },
    '39.0458,-76.6413': { type: 'state', id: 'Maryland' },
    '42.4072,-71.3824': { type: 'state', id: 'Massachusetts' },
    '44.3467,-85.4102': { type: 'state', id: 'Michigan' },
    '46.7296,-94.6859': { type: 'state', id: 'Minnesota' },
    '32.3547,-89.3985': { type: 'state', id: 'Mississippi' },
    '37.9643,-91.8318': { type: 'state', id: 'Missouri' },
    '47.0527,-109.6333': { type: 'state', id: 'Montana' },
    '41.4925,-99.9018': { type: 'state', id: 'Nebraska' },
    '38.8026,-116.4194': { type: 'state', id: 'Nevada' },
    '43.1939,-71.5724': { type: 'state', id: 'New Hampshire' },
    '40.0583,-74.4057': { type: 'state', id: 'New Jersey' },
    '34.5199,-105.8701': { type: 'state', id: 'New Mexico' },
    '43.2994,-74.2179': { type: 'state', id: 'New York' },
    '35.7596,-79.0193': { type: 'state', id: 'North Carolina' },
    '47.5515,-101.0020': { type: 'state', id: 'North Dakota' },
    '40.4173,-82.9071': { type: 'state', id: 'Ohio' },
    '35.0078,-97.0929': { type: 'state', id: 'Oklahoma' },
    '43.8041,-120.5542': { type: 'state', id: 'Oregon' },
    '41.2033,-77.1945': { type: 'state', id: 'Pennsylvania' },
    '41.6809,-71.5118': { type: 'state', id: 'Rhode Island' },
    '33.8361,-81.1637': { type: 'state', id: 'South Carolina' },
    '43.9695,-99.9018': { type: 'state', id: 'South Dakota' },
    '35.5175,-86.5804': { type: 'state', id: 'Tennessee' },
    '31.9686,-99.9018': { type: 'state', id: 'Texas' },
    '39.3210,-111.0937': { type: 'state', id: 'Utah' },
    '44.5588,-72.5805': { type: 'state', id: 'Vermont' },
    '37.4316,-78.6569': { type: 'state', id: 'Virginia' },
    '47.7511,-120.7401': { type: 'state', id: 'Washington' },
    '38.3498,-80.6201': { type: 'state', id: 'West Virginia' },
    '43.7844,-88.7879': { type: 'state', id: 'Wisconsin' },
    '43.0759,-107.2903': { type: 'state', id: 'Wyoming' }
  };
  
  const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  return coordMap[coordKey] || { type: 'nyc', id: '107' }; // Default to Manhattan
}

// Get US state data with proper AQI calculation
function getStateData(stateName) {
  const stateRecords = usData
    .filter(record => record['StateName'] === stateName)
    .sort((a, b) => parseInt(b['ReportYear']) - parseInt(a['ReportYear']));
  
  if (stateRecords.length === 0) return null;
  
  // Get latest PM2.5 concentration data (MeasureId 87 or 296)
  const pm25Record = stateRecords.find(r => 
    (r['MeasureId'] === '87' || r['MeasureId'] === '296') && 
    r['MeasureName'].includes('PM2.5') && 
    r['MeasureName'].includes('average ambient concentrations')
  );
  
  // Get ozone exceedance days (MeasureId 83 or 292)
  const ozoneRecord = stateRecords.find(r => 
    (r['MeasureId'] === '83' || r['MeasureId'] === '292') && 
    r['MeasureName'].includes('ozone') && 
    r['MeasureName'].includes('days with maximum')
  );
  
  // Calculate average values across counties for the state
  const pm25Records = stateRecords.filter(r => 
    (r['MeasureId'] === '87' || r['MeasureId'] === '296') && 
    r['Value'] && !isNaN(parseFloat(r['Value']))
  );
  
  const ozoneRecords = stateRecords.filter(r => 
    (r['MeasureId'] === '83' || r['MeasureId'] === '292') && 
    r['Value'] && !isNaN(parseFloat(r['Value']))
  );
  
  // Calculate averages
  const avgPM25 = pm25Records.length > 0 ? 
    pm25Records.reduce((sum, r) => sum + parseFloat(r['Value']), 0) / pm25Records.length : null;
  
  const avgOzone = ozoneRecords.length > 0 ? 
    ozoneRecords.reduce((sum, r) => sum + parseFloat(r['Value']), 0) / ozoneRecords.length : null;
  
  return {
    pm25: avgPM25,
    ozone: avgOzone,
    location: stateName,
    type: 'state',
    lastUpdated: stateRecords[0]['ReportYear'],
    counties: [...new Set(stateRecords.map(r => r['CountyName']))].length,
    dataPoints: stateRecords.length
  };
}

// ============================================
// API ROUTES
// ============================================

// Main endpoint - matches your frontend (using DataFetcher service)
app.get('/api/air-quality', async (req, res) => {
  try {
    console.log('📊 Air quality data requested from CSV via DataFetcher');
    
    // Get location parameters
    const latitude = req.query.lat ? parseFloat(req.query.lat) : 40.7128;
    const longitude = req.query.lng ? parseFloat(req.query.lng) : -74.0060;
    const stateName = req.query.state || null;
    
    // Use DataFetcher service to get all data
    const allData = await dataFetcher.fetchAllData(latitude, longitude, stateName);
    
    // Get state-specific data if available
    let stateData = null;
    if (stateName) {
      stateData = dataFetcher.getStateData(stateName);
    }
    
    // Calculate primary AQI from ground station data
    const aqi = allData.ground.aqi;
    const category = getAQICategory(aqi);
    
    // Format response for your frontend
    const response = {
      location: stateName || 'New York City',
      aqi: aqi,
      pollutants: [
        { name: "PM2.5", value: allData.ground.pm25 },
        { name: "PM10", value: allData.ground.pm10 },
        { name: "NO2", value: allData.tempo.no2 * 1000 }, // Convert ppm to ppb
        { name: "O3", value: allData.tempo.o3 * 1000 }, // Convert ppm to ppb
        { name: "SO2", value: allData.tempo.so2 * 1000 }, // Convert ppm to ppb
        { name: "CO", value: Math.random() * 2 }
      ],
      weather: {
        temperature: allData.weather.temperature,
        humidity: allData.weather.humidity,
        windSpeed: allData.weather.windSpeed,
        windDirection: allData.weather.windDirection,
        pressure: allData.weather.pressure,
        visibility: allData.weather.visibility
      },
      category: category,
      primaryPollutant: allData.ground.pm25 > 25 ? 'PM2.5' : 'NO2',
      lastUpdated: allData.timestamp,
      timestamp: new Date().toISOString(),
      source: allData.dataSource,
      trend: Math.random() > 0.5 ? (Math.random() > 0.5 ? 1 : -1) : 0,
      dataType: stateName ? 'state' : 'city',
      counties: stateData ? stateData.counties : null
    };
    
    console.log(`✓ Sent data for ${response.location} - AQI: ${aqi} (${response.dataType})`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality data',
      message: error.message 
    });
  }
});

// Forecast endpoint for frontend (using DataFetcher service)
app.get('/api/forecast', async (req, res) => {
  try {
    console.log('📈 Forecast data requested');
    
    const stateName = req.query.state || null;
    const hours = parseInt(req.query.hours) || 24;
    
    // Get current data to base forecast on
    const currentData = await dataFetcher.fetchAllData(40.7128, -74.0060, stateName);
    const baseAqi = currentData.ground.aqi;
    
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
      
      // Generate weather forecast
      const weatherData = await dataFetcher.fetchWeatherData(stateName);
      
      forecast.push({
        time: time.toISOString(),
        aqi: forecastAqi,
        temperature: weatherData.temperature + Math.sin(i * 0.2) * 5,
        humidity: weatherData.humidity + Math.cos(i * 0.15) * 10
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

// Get all available locations (NYC + US States)
app.get('/api/locations', (req, res) => {
  // NYC locations
  const nycLocations = [...new Set(nycData.map(r => r['Geo Join ID']))]
    .map(id => ({
      id: id,
      name: locationMap[id] || `Location ${id}`,
      type: 'nyc',
      dataPoints: nycData.filter(r => r['Geo Join ID'] === id).length
    }))
    .filter(loc => loc.dataPoints > 0);
  
  // US States
  const stateLocations = [...new Set(usData.map(r => r['StateName']))]
    .map(state => ({
      id: state,
      name: state,
      type: 'state',
      dataPoints: usData.filter(r => r['StateName'] === state).length,
      counties: [...new Set(usData.filter(r => r['StateName'] === state).map(r => r['CountyName']))].length
    }))
    .filter(loc => loc.dataPoints > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  res.json({
    success: true,
    nyc: {
      count: nycLocations.length,
      locations: nycLocations
    },
    states: {
      count: stateLocations.length,
      locations: stateLocations
    },
    total: nycLocations.length + stateLocations.length
  });
});

// Get all US states (using DataFetcher service)
app.get('/api/states', (req, res) => {
  try {
    const states = dataFetcher.getAvailableStates();
    
    res.json({
      success: true,
      count: states.length,
      states: states
    });
  } catch (error) {
    console.error('❌ States Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch states data',
      message: error.message 
    });
  }
});

// Get counties for a specific state
app.get('/api/states/:stateName/counties', (req, res) => {
  const stateName = req.params.stateName;
  const stateData = usData.filter(r => r['StateName'] === stateName);
  
  if (stateData.length === 0) {
    return res.status(404).json({
      success: false,
      error: `No data found for state: ${stateName}`
    });
  }
  
  const counties = [...new Set(stateData.map(r => r['CountyName']))]
    .map(county => {
      const countyData = stateData.filter(r => r['CountyName'] === county);
      const latestYear = Math.max(...countyData.map(r => parseInt(r['ReportYear'])));
      
      return {
        name: county,
        fips: countyData[0]['CountyFips'],
        latestYear: latestYear,
        dataPoints: countyData.length
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  
  res.json({
    success: true,
    state: stateName,
    count: counties.length,
    counties: counties
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

// Get map statistics (using DataFetcher service)
app.get('/api/map-stats', (req, res) => {
  try {
    const states = dataFetcher.getAvailableStates();
    const stateStats = [];
    
    states.forEach(state => {
      const stateData = dataFetcher.getStateData(state.name);
      if (stateData && stateData.pm25 !== null) {
        const aqi = dataFetcher.calculateAQI(stateData.pm25);
        
        stateStats.push({
          state: state.name,
          aqi: aqi,
          pm25: stateData.pm25,
          counties: stateData.counties
        });
      }
    });
    
    const totalStations = stateStats.length;
    const averageAqi = totalStations > 0 ? 
      Math.round(stateStats.reduce((sum, s) => sum + s.aqi, 0) / totalStations) : 0;
    const highestAqi = totalStations > 0 ? 
      Math.max(...stateStats.map(s => s.aqi)) : 0;
    
    res.json({
      success: true,
      totalStations,
      averageAqi,
      highestAqi,
      stateData: stateStats
    });
    
  } catch (error) {
    console.error('❌ Map Stats Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate map statistics',
      message: error.message 
    });
  }
});

// Health check (using DataFetcher service)
app.get('/api/health', (req, res) => {
  try {
    const stats = dataFetcher.getDataStats();
    
    res.json({
      success: true,
      status: 'healthy',
      dataSource: 'CSV Files via DataFetcher Service',
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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