import React from 'react';
import './WeatherInfo.css';

const WeatherInfo = ({ data }) => {
  // Mock weather data if not provided
  const weatherData = data || {
    temperature: 22,
    humidity: 65,
    windSpeed: 12,
    windDirection: 'NW',
    pressure: 1013,
    visibility: 10
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
              {weatherData.temperature}°C
            </div>
            <div className="weather-label">Temperature</div>
          </div>
        </div>

        <div className="weather-item humidity">
          <div className="weather-icon">💧</div>
          <div className="weather-details">
            <div className="weather-value">{weatherData.humidity}%</div>
            <div className="weather-label">Humidity</div>
          </div>
        </div>

        <div className="weather-item wind">
          <div className="weather-icon">
            {getWindDirectionIcon(weatherData.windDirection)}
          </div>
          <div className="weather-details">
            <div className="weather-value">
              {weatherData.windSpeed} km/h
            </div>
            <div className="weather-label">
              Wind {weatherData.windDirection}
            </div>
          </div>
        </div>

        <div className="weather-item pressure">
          <div className="weather-icon">📊</div>
          <div className="weather-details">
            <div className="weather-value">{weatherData.pressure} hPa</div>
            <div className="weather-label">Pressure</div>
          </div>
        </div>

        <div className="weather-item visibility">
          <div className="weather-icon">👁️</div>
          <div className="weather-details">
            <div className="weather-value">{weatherData.visibility} km</div>
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