class DataProcessor {
  calculateAQI(pm25) {
    if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
  }

  normalizeData(rawData) {
    if (!rawData) return null;

    const pm25 = rawData.ground?.pm25 || 0;
    const aqi = rawData.ground?.aqi || this.calculateAQI(pm25);

    return {
      aqi: aqi,
      pm25: pm25,
      pm10: rawData.ground?.pm10 || 0,
      no2: rawData.tempo?.no2 || 0,
      o3: rawData.tempo?.o3 || 0,
      so2: rawData.tempo?.so2 || 0,
      temperature: rawData.weather?.temperature || 0,
      humidity: rawData.weather?.humidity || 0,
      windSpeed: rawData.weather?.windSpeed || 0,
      windDirection: rawData.weather?.windDirection || 0,
      pressure: rawData.weather?.pressure || 0,
      timestamp: rawData.timestamp
    };
  }

  prepareForPrediction(data) {
    return [
      data.pm25 / 500,
      data.pm10 / 600,
      data.no2 / 200,
      data.o3 / 300,
      data.temperature / 50,
      data.humidity / 100,
      data.windSpeed / 30,
      data.pressure / 1100
    ];
  }

  getAQICategory(aqi) {
    if (aqi <= 50) return { level: 'Good', color: '#00e400', description: 'Air quality is good' };
    if (aqi <= 100) return { level: 'Moderate', color: '#ffff00', description: 'Air quality is acceptable' };
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Sensitive groups may experience health effects' };
    if (aqi <= 200) return { level: 'Unhealthy', color: '#ff0000', description: 'Everyone may begin to experience health effects' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert: serious effects' };
    return { level: 'Hazardous', color: '#7e0023', description: 'Health warnings of emergency conditions' };
  }

  getLocationName(latitude, longitude) {
    if (Math.abs(latitude - 40.7128) < 0.5 && Math.abs(longitude + 74.0060) < 0.5) {
      return 'New York, NY';
    }
    if (Math.abs(latitude - 1.3521) < 0.5 && Math.abs(longitude - 103.8198) < 0.5) {
      return 'Singapore';
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

module.exports = new DataProcessor();