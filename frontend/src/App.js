import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAirQuality = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/air-quality');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAirQuality(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setAirQuality(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchAirQuality, 300000); 

    return () => clearInterval(intervalId);
  }, []);

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return { backgroundColor: '#00e400', color: 'black' }; // Good
    if (aqi <= 100) return { backgroundColor: '#ffff00', color: 'black' }; // Moderate
    if (aqi <= 150) return { backgroundColor: '#ff7e00', color: 'black' }; // Unhealthy for Sensitive Groups
    return { backgroundColor: '#ff0000', color: 'white' }; // Unhealthy
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>NASA TEMPO Air Quality Forecast</h1>
      </header>
      <main>
        {loading && <p className="loading">Loading Air Quality Data...</p>}
        {error && <p className="error">Error: {error}</p>}
        {airQuality && (
          <div className="air-quality-info">
            <div className="current-aqi">
              <h2>Current Air Quality in {airQuality.location}</h2>
              <div className="aqi-value" style={getAqiColor(airQuality.aqi)}>
                {airQuality.aqi}
              </div>
              <p style={{textAlign: 'center'}}>AQI</p>
            </div>
            <div className="pollutants">
              <h3>Key Pollutants</h3>
              <ul>
                {airQuality.pollutants.map(p => (
                  <li key={p.name}>{p.name}: {p.value.toFixed(4)}</li>
                ))}
              </ul>
            </div>
            <div className="forecast">
              <h3>Forecast</h3>
              <ul>
                {airQuality.forecast.map(f => (
                  <li key={f.day}>{f.day}: AQI {f.aqi}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
