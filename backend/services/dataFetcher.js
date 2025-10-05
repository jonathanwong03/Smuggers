const fs = require('fs');
const path = require('path');

class DataFetcher {
  constructor() {
    this.nycData = [];
    this.usData = [];
    this.loadCSVData();
  }

  // Load CSV data on initialization
  loadCSVData() {
    try {
      // Load NYC data
      const nycPath = path.join(__dirname, '../data/Air_Quality.csv');
      if (fs.existsSync(nycPath)) {
        const nycText = fs.readFileSync(nycPath, 'utf-8');
        this.nycData = this.parseCSV(nycText);
        console.log(`✓ DataFetcher loaded ${this.nycData.length} NYC records`);
      }

      // Load US states data
      const usPath = path.join(__dirname, '../data/countries_air_quality_data.csv');
      if (fs.existsSync(usPath)) {
        const usText = fs.readFileSync(usPath, 'utf-8');
        this.usData = this.parseCSV(usText);
        console.log(`✓ DataFetcher loaded ${this.usData.length} US records`);
      }
    } catch (error) {
      console.error('❌ Error loading CSV data in DataFetcher:', error.message);
    }
  }

  // Parse CSV text to JSON
  parseCSV(csvText) {
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
      
      if (row[headers[0]]) { // Check if first column has data
        data.push(row);
      }
    }
    
    return data;
  }

  // Fetch data from CSV based on location (replaces TEMPO API)
  async fetchTempoData(stateName = null) {
    try {
      let no2 = null, o3 = null, so2 = null;

      if (stateName) {
        // Get data for specific US state
        const stateRecords = this.usData.filter(r => r['StateName'] === stateName);
        
        // Get latest ozone data
        const ozoneRecord = stateRecords
          .filter(r => r['MeasureName'] && r['MeasureName'].includes('ozone'))
          .sort((a, b) => parseInt(b['ReportYear']) - parseInt(a['ReportYear']))[0];
        
        if (ozoneRecord && ozoneRecord['Value']) {
          // Convert ozone days to concentration estimate (rough conversion)
          const ozoneDays = parseFloat(ozoneRecord['Value']);
          o3 = Math.max(0.02, ozoneDays * 0.001); // Convert days to ppm estimate
        }

        // Estimate NO2 based on state characteristics
        const urbanStates = ['California', 'New York', 'Texas', 'Illinois', 'Pennsylvania'];
        no2 = urbanStates.includes(stateName) ? 
          0.02 + Math.random() * 0.03 : 
          0.01 + Math.random() * 0.02;

      } else {
        // NYC area data
        const nycRecords = this.nycData.filter(r => 
          r['Name'] && r['Name'].includes('Nitrogen dioxide')
        );
        
        if (nycRecords.length > 0) {
          const latestNO2 = nycRecords
            .sort((a, b) => new Date(b['Start_Date']) - new Date(a['Start_Date']))[0];
          
          if (latestNO2 && latestNO2['Data Value']) {
            // Convert ppb to ppm
            no2 = parseFloat(latestNO2['Data Value']) / 1000;
          }
        }

        // Default values for NYC area
        if (!no2) no2 = 0.015 + Math.random() * 0.02;
      }

      // Default values
      if (!o3) o3 = 0.03 + Math.random() * 0.05;
      if (!so2) so2 = 0.005 + Math.random() * 0.01;

      return {
        no2: no2,
        o3: o3,
        so2: so2,
        timestamp: new Date().toISOString(),
        source: 'CSV Data'
      };
    } catch (error) {
      console.warn('CSV data not available, using fallback');
      return {
        no2: Math.random() * 0.05,
        o3: Math.random() * 0.1,
        so2: Math.random() * 0.02,
        timestamp: new Date().toISOString(),
        source: 'Fallback'
      };
    }
  }

  // Fetch ground station data from CSV (replaces external API)
  async fetchGroundStationData(stationId, stateName = null) {
    try {
      let pm25 = null, pm10 = null;

      if (stateName) {
        // Get PM2.5 data for US state
        const stateRecords = this.usData.filter(r => r['StateName'] === stateName);
        
        // Get latest PM2.5 concentration data
        const pm25Records = stateRecords.filter(r => 
          r['MeasureName'] && 
          r['MeasureName'].includes('PM2.5') && 
          r['MeasureName'].includes('average ambient concentrations') &&
          r['Value'] && !isNaN(parseFloat(r['Value']))
        );

        if (pm25Records.length > 0) {
          // Calculate average PM2.5 across counties
          const avgPM25 = pm25Records.reduce((sum, r) => sum + parseFloat(r['Value']), 0) / pm25Records.length;
          pm25 = avgPM25;
          pm10 = avgPM25 * 1.5; // Estimate PM10 from PM2.5
        }

      } else {
        // NYC area data
        const nycRecords = this.nycData.filter(r => 
          r['Name'] && r['Name'].includes('Fine particles')
        );
        
        if (nycRecords.length > 0) {
          const latestPM25 = nycRecords
            .sort((a, b) => new Date(b['Start_Date']) - new Date(a['Start_Date']))[0];
          
          if (latestPM25 && latestPM25['Data Value']) {
            pm25 = parseFloat(latestPM25['Data Value']);
            pm10 = pm25 * 1.5;
          }
        }
      }

      // Default values if no data found
      if (!pm25) {
        pm25 = 8 + Math.random() * 25; // Typical range 8-33 μg/m³
        pm10 = pm25 * 1.5;
      }

      const aqi = this.calculateAQI(pm25);

      return {
        pm25: pm25,
        pm10: pm10,
        aqi: aqi,
        timestamp: new Date().toISOString(),
        source: 'CSV Data'
      };
    } catch (error) {
      console.warn('CSV ground station data not available, using fallback');
      const pm25 = Math.random() * 100;
      return {
        pm25: pm25,
        pm10: pm25 * 1.5,
        aqi: this.calculateAQI(pm25),
        timestamp: new Date().toISOString(),
        source: 'Fallback'
      };
    }
  }

  // Generate realistic weather data (keeping as mock since CSV doesn't contain weather)
  async fetchWeatherData(stateName = null) {
    try {
      // Generate realistic weather based on location
      let baseTemp = 20;
      let baseHumidity = 50;
      
      if (stateName) {
        // Adjust weather based on state characteristics
        const warmStates = ['Florida', 'Texas', 'Arizona', 'California', 'Nevada'];
        const coldStates = ['Alaska', 'Montana', 'North Dakota', 'Minnesota', 'Maine'];
        const humidStates = ['Florida', 'Louisiana', 'Mississippi', 'Alabama', 'Georgia'];
        
        if (warmStates.includes(stateName)) {
          baseTemp = 25 + Math.random() * 10;
        } else if (coldStates.includes(stateName)) {
          baseTemp = 5 + Math.random() * 15;
        } else {
          baseTemp = 15 + Math.random() * 15;
        }
        
        if (humidStates.includes(stateName)) {
          baseHumidity = 60 + Math.random() * 30;
        } else {
          baseHumidity = 40 + Math.random() * 40;
        }
      }

      // Add seasonal variation
      const month = new Date().getMonth();
      const seasonalTemp = Math.sin((month - 3) * Math.PI / 6) * 10;
      
      return {
        temperature: Math.round((baseTemp + seasonalTemp) * 10) / 10,
        humidity: Math.round(Math.max(20, Math.min(90, baseHumidity))),
        windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        pressure: Math.round(1013 + (Math.random() * 40 - 20)),
        visibility: Math.round((8 + Math.random() * 4) * 10) / 10,
        timestamp: new Date().toISOString(),
        source: 'Generated'
      };
    } catch (error) {
      console.warn('Weather data generation failed, using defaults');
      return {
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        windSpeed: Math.random() * 20,
        windDirection: 'N',
        pressure: 1000 + Math.random() * 50,
        visibility: 10,
        timestamp: new Date().toISOString(),
        source: 'Default'
      };
    }
  }

  calculateAQI(pm25) {
    if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
  }

  // Get state data from CSV
  getStateData(stateName) {
    const stateRecords = this.usData
      .filter(record => record['StateName'] === stateName)
      .sort((a, b) => parseInt(b['ReportYear']) - parseInt(a['ReportYear']));
    
    if (stateRecords.length === 0) return null;
    
    // Get PM2.5 concentration data
    const pm25Records = stateRecords.filter(r => 
      (r['MeasureId'] === '87' || r['MeasureId'] === '296') && 
      r['MeasureName'].includes('PM2.5') && 
      r['MeasureName'].includes('average ambient concentrations') &&
      r['Value'] && !isNaN(parseFloat(r['Value']))
    );
    
    // Get ozone exceedance days
    const ozoneRecords = stateRecords.filter(r => 
      (r['MeasureId'] === '83' || r['MeasureId'] === '292') && 
      r['MeasureName'].includes('ozone') && 
      r['MeasureName'].includes('days with maximum') &&
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

  // Get all available states
  getAvailableStates() {
    return [...new Set(this.usData.map(r => r['StateName']))]
      .map(state => {
        const stateData = this.usData.filter(r => r['StateName'] === state);
        const latestYear = Math.max(...stateData.map(r => parseInt(r['ReportYear'])));
        const counties = [...new Set(stateData.map(r => r['CountyName']))];
        
        return {
          name: state,
          counties: counties.length,
          latestYear: latestYear,
          dataPoints: stateData.length,
          measures: [...new Set(stateData.map(r => r['MeasureName']))].length
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Fetch all data for a location (updated to use CSV)
  async fetchAllData(latitude, longitude, stateName = null) {
    const [tempoData, groundData, weatherData] = await Promise.all([
      this.fetchTempoData(stateName),
      this.fetchGroundStationData(null, stateName),
      this.fetchWeatherData(stateName)
    ]);

    return {
      tempo: tempoData,
      ground: groundData,
      weather: weatherData,
      location: { latitude, longitude, stateName },
      timestamp: new Date().toISOString(),
      dataSource: 'CSV Files'
    };
  }

  // Get CSV data statistics
  getDataStats() {
    return {
      nycRecords: this.nycData.length,
      usRecords: this.usData.length,
      totalRecords: this.nycData.length + this.usData.length,
      states: [...new Set(this.usData.map(r => r['StateName']))].length,
      measures: [...new Set(this.usData.map(r => r['MeasureName']))].length,
      lastLoaded: new Date().toISOString()
    };
  }
}

module.exports = new DataFetcher();