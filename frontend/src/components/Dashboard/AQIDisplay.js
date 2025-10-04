import React from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './AQIDisplay.css';

const AQIDisplay = ({ data, viewMode }) => {
  const { getAqiColor, getAqiLabel } = useAirQuality();
  
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
    <div className={`aqi-display ${viewMode}`}>
      <div className="aqi-main">
        <div 
          className="aqi-circle"
          style={{ 
            background: `conic-gradient(${aqiColor} ${(aqiValue / 500) * 360}deg, var(--bg-secondary) 0deg)` 
          }}
        >
          <div className="aqi-inner">
            <div className="aqi-value">{aqiValue}</div>
            <div className="aqi-label">AQI</div>
          </div>
        </div>
        
        <div className="aqi-info">
          <h2 className="aqi-status" style={{ color: aqiColor }}>
            {aqiLabel}
          </h2>
          <p className="aqi-location">📍 {data?.location || 'Unknown Location'}</p>
          
          {viewMode !== 'compact' && (
            <>
              <div className="aqi-trend">
                <span className="trend-icon">{getTrendIcon(data?.trend || 0)}</span>
                <span className="trend-text">
                  {data?.trend > 0 ? 'Worsening' : data?.trend < 0 ? 'Improving' : 'Stable'}
                </span>
              </div>
              
              <p className="health-message">
                {getHealthMessage(aqiValue)}
              </p>
            </>
          )}
        </div>
      </div>

      {viewMode === 'detailed' && (
        <div className="aqi-details">
          <div className="detail-item">
            <span className="detail-label">Primary Pollutant</span>
            <span className="detail-value">{data?.primaryPollutant || 'PM2.5'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last Updated</span>
            <span className="detail-value">
              {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Data Source</span>
            <span className="detail-value">NASA TEMPO</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIDisplay;