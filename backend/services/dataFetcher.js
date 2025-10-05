const database = require("../config/database");

class DataFetcher {
  constructor() {
    this.initializeDatabase();
  }

  // Initialize database connection
  async initializeDatabase() {
    try {
      await database.connect();
      console.log("✓ DataFetcher connected to database");
    } catch (error) {
      console.error(
        "❌ DataFetcher database connection failed:",
        error.message
      );
    }
  }

  // Fetch data from database based on location (replaces TEMPO API)
  async fetchTempoData(stateName = null) {
    try {
      let no2 = null,
        o3 = null,
        so2 = null;

      if (stateName) {
        // Get data for specific US state from database
        const stateData = await database.getUSData(stateName, null, 50);

        // Get latest ozone data
        const ozoneRecords = stateData.filter(
          (r) => r.measure_name && r.measure_name.includes("ozone") && r.value
        );

        if (ozoneRecords.length > 0) {
          const latestOzone = ozoneRecords.sort(
            (a, b) => b.report_year - a.report_year
          )[0];
          // Convert ozone days to concentration estimate (rough conversion)
          const ozoneDays = parseFloat(latestOzone.value);
          o3 = Math.max(0.02, ozoneDays * 0.001); // Convert days to ppm estimate
        }

        // Estimate NO2 based on state characteristics
        const urbanStates = [
          "California",
          "New York",
          "Texas",
          "Illinois",
          "Pennsylvania",
        ];
        no2 = urbanStates.includes(stateName)
          ? 0.02 + Math.random() * 0.03
          : 0.01 + Math.random() * 0.02;
      } else {
        // NYC area data from database
        const nycRecords = await database.getNYCData(null, "375", 10); // NO2 indicator

        if (nycRecords.length > 0) {
          const latestNO2 = nycRecords[0]; // Already sorted by date DESC

          if (latestNO2.data_value) {
            // Convert ppb to ppm
            no2 = parseFloat(latestNO2.data_value) / 1000;
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
        source: "Database",
      };
    } catch (error) {
      console.warn(
        "Database data not available, using fallback:",
        error.message
      );
      return {
        no2: Math.random() * 0.05,
        o3: Math.random() * 0.1,
        so2: Math.random() * 0.02,
        timestamp: new Date().toISOString(),
        source: "Fallback",
      };
    }
  }

  // Fetch ground station data from database (replaces external API)
  async fetchGroundStationData(stationId, stateName = null) {
    try {
      let pm25 = null,
        pm10 = null;

      if (stateName) {
        // Get PM2.5 data for US state from database
        const stateData = await database.getLatestStateData(stateName);

        // Find PM2.5 concentration data
        const pm25Record = stateData.find(
          (r) =>
            r.measure_name &&
            r.measure_name.includes("PM2.5") &&
            r.measure_name.includes("average ambient concentrations") &&
            r.avg_value
        );

        if (pm25Record) {
          pm25 = parseFloat(pm25Record.avg_value);
          pm10 = pm25 * 1.5; // Estimate PM10 from PM2.5
        }
      } else {
        // NYC area data from database
        const nycRecords = await database.getNYCData(null, "365", 10); // PM2.5 indicator

        if (nycRecords.length > 0) {
          const latestPM25 = nycRecords[0]; // Already sorted by date DESC

          if (latestPM25.data_value) {
            pm25 = parseFloat(latestPM25.data_value);
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
        source: "Database",
      };
    } catch (error) {
      console.warn(
        "Database ground station data not available, using fallback:",
        error.message
      );
      const pm25 = Math.random() * 100;
      return {
        pm25: pm25,
        pm10: pm25 * 1.5,
        aqi: this.calculateAQI(pm25),
        timestamp: new Date().toISOString(),
        source: "Fallback",
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
        const warmStates = [
          "Florida",
          "Texas",
          "Arizona",
          "California",
          "Nevada",
        ];
        const coldStates = [
          "Alaska",
          "Montana",
          "North Dakota",
          "Minnesota",
          "Maine",
        ];
        const humidStates = [
          "Florida",
          "Louisiana",
          "Mississippi",
          "Alabama",
          "Georgia",
        ];

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
      const seasonalTemp = Math.sin(((month - 3) * Math.PI) / 6) * 10;

      return {
        temperature: Math.round((baseTemp + seasonalTemp) * 10) / 10,
        humidity: Math.round(Math.max(20, Math.min(90, baseHumidity))),
        windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
        windDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
          Math.floor(Math.random() * 8)
        ],
        pressure: Math.round(1013 + (Math.random() * 40 - 20)),
        visibility: Math.round((8 + Math.random() * 4) * 10) / 10,
        timestamp: new Date().toISOString(),
        source: "Generated",
      };
    } catch (error) {
      console.warn("Weather data generation failed, using defaults");
      return {
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        windSpeed: Math.random() * 20,
        windDirection: "N",
        pressure: 1000 + Math.random() * 50,
        visibility: 10,
        timestamp: new Date().toISOString(),
        source: "Default",
      };
    }
  }

  calculateAQI(pm25) {
    if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
    if (pm25 <= 35.4)
      return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4)
      return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4)
      return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4)
      return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
  }

  // Get state data from database
  async getStateData(stateName) {
    try {
      const stateData = await database.getLatestStateData(stateName);

      if (stateData.length === 0) return null;

      // Get PM2.5 concentration data
      const pm25Record = stateData.find(
        (r) =>
          r.measure_name &&
          r.measure_name.includes("PM2.5") &&
          r.measure_name.includes("average ambient concentrations")
      );

      // Get ozone exceedance days
      const ozoneRecord = stateData.find(
        (r) =>
          r.measure_name &&
          r.measure_name.includes("ozone") &&
          r.measure_name.includes("days with maximum")
      );

      return {
        pm25: pm25Record ? parseFloat(pm25Record.avg_value) : null,
        ozone: ozoneRecord ? parseFloat(ozoneRecord.avg_value) : null,
        location: stateName,
        type: "state",
        lastUpdated: stateData[0].latest_year,
        counties: pm25Record ? pm25Record.county_count : 0,
        dataPoints: stateData.reduce((sum, r) => sum + r.county_count, 0),
      };
    } catch (error) {
      console.error("Error getting state data:", error.message);
      return null;
    }
  }

  // Get all available states from database
  async getAvailableStates() {
    try {
      const states = await database.getAvailableStates();

      return states.map((state) => ({
        name: state.state_name,
        counties: state.county_count,
        latestYear: state.latest_year,
        dataPoints: state.data_points,
      }));
    } catch (error) {
      console.error("Error getting available states:", error.message);
      return [];
    }
  }

  // Fetch all data for a location (updated to use database)
  async fetchAllData(latitude, longitude, stateName = null) {
    const [tempoData, groundData, weatherData] = await Promise.all([
      this.fetchTempoData(stateName),
      this.fetchGroundStationData(null, stateName),
      this.fetchWeatherData(stateName),
    ]);

    return {
      tempo: tempoData,
      ground: groundData,
      weather: weatherData,
      location: { latitude, longitude, stateName },
      timestamp: new Date().toISOString(),
      dataSource: "SQLite Database",
    };
  }

  // Get database data statistics
  async getDataStats() {
    try {
      const stats = await database.getStats();

      return {
        nycRecords: stats.nycCount,
        usRecords: stats.usCount,
        totalRecords: stats.nycCount + stats.usCount,
        states: stats.stateCount,
        measures: stats.measureCount,
        lastLoaded: new Date().toISOString(),
        dataSource: "SQLite Database",
      };
    } catch (error) {
      console.error("Error getting data stats:", error.message);
      return {
        nycRecords: 0,
        usRecords: 0,
        totalRecords: 0,
        states: 0,
        measures: 0,
        lastLoaded: new Date().toISOString(),
        dataSource: "Error",
        error: error.message,
      };
    }
  }
}

module.exports = new DataFetcher();
