import React, { useState } from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import AQIDisplay from './AQIDisplay';
import PollutantChart from './PollutantChart';
import ForecastChart from './ForecastChart';
import LocationSelector from './LocationSelector';
import WeatherInfo from './WeatherInfo';
import QuickActions from './QuickActions';
import './Dashboard.css';

const Dashboard = () => {
  const { airQuality, loading, error, location } = useAirQuality();
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, compact

  if (loading) {
    return (
      <div className="dashboard loading-state">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Air Quality Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error-state">
        <div className="error-message">
          <h2>⚠️ Unable to Load Data</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="location-info">
          <h1>Air Quality Dashboard</h1>
          <LocationSelector />
        </div>
        
        <div className="view-controls">
          <button 
            className={viewMode === 'overview' ? 'active' : ''}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button 
            className={viewMode === 'detailed' ? 'active' : ''}
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </button>
          <button 
            className={viewMode === 'compact' ? 'active' : ''}
            onClick={() => setViewMode('compact')}
          >
            Compact
          </button>
        </div>
      </div>

      {airQuality && (
        <div className={`dashboard-content ${viewMode}`}>
          <div className="primary-section">
            <AQIDisplay data={airQuality} viewMode={viewMode} />
            {viewMode !== 'compact' && <WeatherInfo data={airQuality.weather} />}
          </div>

          <div className="secondary-section">
            <PollutantChart 
              pollutants={airQuality.pollutants} 
              viewMode={viewMode}
            />
            {viewMode === 'detailed' && (
              <QuickActions currentAqi={airQuality.aqi} />
            )}
          </div>

          <div className="forecast-section">
            <ForecastChart viewMode={viewMode} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;