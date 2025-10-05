import React from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './AQIDisplay.css';

const AQIDisplay = ({ data, viewMode }) => {
  const { getAqiColor, getAqiLabel, location } = useAirQuality();
  
  const aqiValue = data?.aqi || 0;
  const aqiColor = getAqiColor(aqiValue);
  const aqiLabel = getAqiLabel(aqiValue);

  const getHealthMessage = (aqi) => {
    if (aqi <= 50) return "Air quality is good. Perfect for outdoor activities!";
    if (aqi <= 100) return "Air quality is acceptable for most people.";
    if (aqi <= 150) return "Sensitive individuals should limit outdoor exposure.";
    if (aqi <= 200) return "Everyone should limit outdoor activities.";
    if (aqi <= 300) return "Avoid outdoor activities. Health warnings in effect.";
    return "Emergency conditions. Everyone should avoid outdoor exposure.";
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  return (
    <div className={`aqi-display-modern ${viewMode}`}>
      <div className="aqi-card">
        {/* Left side - Circular AQI */}
        <div className="aqi-circle-container">
          <svg className="aqi-circle-svg" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke={aqiColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(aqiValue / 500) * 534} 534`}
              transform="rotate(-90 100 100)"
              style={{
                filter: `drop-shadow(0 0 8px ${aqiColor}40)`,
                transition: 'all 0.5s ease'
              }}
            />
          </svg>
          <div className="aqi-center">
            <div className="aqi-value-large" style={{ color: aqiColor }}>
              {aqiValue}
            </div>
            <div className="aqi-label-small">AQI</div>
          </div>
        </div>

        {/* Right side - Info */}
        <div className="aqi-info-modern">
          <div className="aqi-status-badge" style={{ 
            backgroundColor: `${aqiColor}20`,
            border: `1px solid ${aqiColor}40`,
            color: aqiColor
          }}>
            {aqiLabel}
          </div>
          
          <div className="aqi-location-row">
            <span className="location-icon">📍</span>
            <span className="location-name">{location?.name || 'Unknown Location'}</span>
          </div>
          
          <div className="aqi-trend-row">
            <div className="trend-badge" style={{
              backgroundColor: data?.trend > 0 ? 'rgba(239, 68, 68, 0.1)' : 
                             data?.trend < 0 ? 'rgba(34, 197, 94, 0.1)' : 
                             'rgba(156, 163, 175, 0.1)',
              color: data?.trend > 0 ? '#ef4444' : 
                     data?.trend < 0 ? '#22c55b' : 
                     '#9ca3af'
            }}>
              <span className="trend-icon">{getTrendIcon(data?.trend || 0)}</span>
              <span className="trend-text">
                {data?.trend > 0 ? 'Worsening' : data?.trend < 0 ? 'Improving' : 'Stable'}
              </span>
            </div>
          </div>

          {viewMode !== 'compact' && (
            <p className="health-message-modern">
              {getHealthMessage(aqiValue)}
            </p>
          )}
        </div>
      </div>

      {viewMode === 'detailed' && (
        <div className="aqi-metadata">
          <div className="metadata-item">
            <span className="metadata-icon">🔬</span>
            <div className="metadata-content">
              <span className="metadata-label">Primary Pollutant</span>
              <span className="metadata-value">{data?.primaryPollutant || 'PM2.5'}</span>
            </div>
          </div>
          <div className="metadata-item">
            <span className="metadata-icon">🕐</span>
            <div className="metadata-content">
              <span className="metadata-label">Last Updated</span>
              <span className="metadata-value">
                {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>
          <div className="metadata-item">
            <span className="metadata-icon">🛰️</span>
            <div className="metadata-content">
              <span className="metadata-label">Data Source</span>
              <span className="metadata-value">NASA TEMPO</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIDisplay;