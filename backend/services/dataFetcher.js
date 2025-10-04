const axios = require('axios');
const config = require('../config/config');

class DataFetcher {
  async fetchTempoData(latitude, longitude) {
    try {
      const url = `https://api.nasa.gov/tempo/v1/air-quality`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          api_key: config.tempoApiKey
        },
        timeout: 10000
      });
      
      return {
        no2: response.data.no2 || null,
        o3: response.data.ozone || null,
        so2: response.data.so2 || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('TEMPO API not available, using mock data');
      return {
        no2: Math.random() * 0.05,
        o3: Math.random() * 0.1,
        so2: Math.random() * 0.02,
        timestamp: new Date().toISOString()
      };
    }
  }

  async fetchGroundStationData(stationId) {
    try {
      const response = await axios.get(
        `${config.groundStationUrl}/station/${stationId}`,
        { timeout: 10000 }
      );
      
      return {
        pm25: response.data.pm25 || null,
        pm10: response.data.pm10 || null,
        aqi: response.data.aqi || null,
        timestamp: response.data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.warn('Ground station API not available, using mock data');
      const pm25 = Math.random() * 100;
      return {
        pm25: pm25,
        pm10: pm25 * 1.5,
        aqi: this.calculateAQI(pm25),
        timestamp: new Date().toISOString()
      };
    }
  }

  async fetchWeatherData(latitude, longitude) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: config.weatherApiKey,
          units: 'metric'
        },
        timeout: 10000
      });
      
      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        pressure: response.data.main.pressure,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Weather API not available, using mock data');
      return {
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        windSpeed: Math.random() * 20,
        windDirection: Math.random() * 360,
        pressure: 1000 + Math.random() * 50,
        timestamp: new Date().toISOString()
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

  async fetchAllData(latitude, longitude, stationId) {
    const [tempoData, groundData, weatherData] = await Promise.all([
      this.fetchTempoData(latitude, longitude),
      this.fetchGroundStationData(stationId),
      this.fetchWeatherData(latitude, longitude)
    ]);

    return {
      tempo: tempoData,
      ground: groundData,
      weather: weatherData,
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DataFetcher();