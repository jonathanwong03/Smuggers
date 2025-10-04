import React from 'react';
import './WeatherInfo.css';

const WeatherInfo = ({ data }) => {
  // Mock weather data if not provided, ensuring all values are numbers
  const weatherData = data ? {
    temperature: typeof data.temperature === 'number' ? data.temperature : parseFloat(data.temperature) || 22,
    humidity: typeof data.humidity === 'number' ? data.humidity : parseFloat(data.humidity) || 65,
    windSpeed: typeof data.windSpeed === 'number' ? data.windSpeed : parseFloat(data.windSpeed) || 12,
    windDirection: data.windDirection || 'NW',
    pressure: typeof data.pressure === 'number' ? data.pressure : parseFloat(data.pressure) || 1013,
    visibility: typeof data.visibility === 'number' ? data.visibility : parseFloat(data.visibility) || 10,
    uvIndex: typeof data.uvIndex === 'number' ? data.uvIndex : parseFloat(data.uvIndex) || 5
  } : {
    temperature: 22,
    humidity: 65,
    windSpeed: 12,
    windDirection: 'NW',
    pressure: 1013,
    visibility: 10,
    uvIndex: 5
  };

  const getWindDirectionIcon = (direction) => {
    const directions = {
      'N': '⬆️', 'NE': '↗️', 'E': '➡️', 'SE': '↘️',
      'S': '⬇️', 'SW': '↙️', 'W': '⬅️', 'NW': '↖️'
    };
    return directions[direction] || '🧭';
  };

  const getTemperatureColor = (temp) => {
    if (temp < 0) return '#0066cc';
    if (temp < 10) return '#0099ff';
    if (temp < 20) return '#00cc99';
    if (temp < 30) return '#ffcc00';
    if (temp < 35) return '#ff9900';
    return '#ff3300';
  };

  return (
    <div className="weather-info">
      <h3>Weather Conditions</h3>
      
      <div className="weather-grid">
        <div className="weather-item temperature">
          <div className="weather-icon">🌡️</div>
          <div className="weather-details">
            <div 
              className="weather-value"
              style={{ color: getTemperatureColor(weatherData.temperature) }}
            >
              {Math.round(weatherData.temperature)}°C
            </div>
            <div className="weather-label">Temperature</div>
          </div>
        </div>

        <div className="weather-item humidity">
          <div className="weather-icon">💧</div>
          <div className="weather-details">
            <div className="weather-value">{Math.round(weatherData.humidity)}%</div>
            <div className="weather-label">Humidity</div>
          </div>
        </div>

        <div className="weather-item wind">
          <div className="weather-icon">
            {getWindDirectionIcon(weatherData.windDirection)}
          </div>
          <div className="weather-details">
            <div className="weather-value">
              {Math.round(weatherData.windSpeed)} km/h
            </div>
            <div className="weather-label">
              Wind {weatherData.windDirection}
            </div>
          </div>
        </div>

        <div className="weather-item pressure">
          <div className="weather-icon">📊</div>
          <div className="weather-details">
            <div className="weather-value">{Math.round(weatherData.pressure)} hPa</div>
            <div className="weather-label">Pressure</div>
          </div>
        </div>

        <div className="weather-item visibility">
          <div className="weather-icon">👁️</div>
          <div className="weather-details">
            <div className="weather-value">{Math.round(weatherData.visibility)} km</div>
            <div className="weather-label">Visibility</div>
          </div>
        </div>

        <div className="weather-item uv">
          <div className="weather-icon">☀️</div>
          <div className="weather-details">
            <div className="weather-value">{weatherData.uvIndex || 5}</div>
            <div className="weather-label">UV Index</div>
          </div>
        </div>
      </div>

      <div className="weather-summary">
        <p>
          {weatherData.temperature > 25 ? 'Warm' : weatherData.temperature > 15 ? 'Mild' : 'Cool'} day with{' '}
          {weatherData.humidity > 70 ? 'high' : weatherData.humidity > 40 ? 'moderate' : 'low'} humidity.{' '}
          {weatherData.windSpeed > 20 ? 'Windy' : weatherData.windSpeed > 10 ? 'Breezy' : 'Calm'} conditions.
        </p>
      </div>
    </div>
  );
};

export default WeatherInfo;