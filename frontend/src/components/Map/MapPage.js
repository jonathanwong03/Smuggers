import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useAirQuality } from '../../contexts/AirQualityContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapPage.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapPage = () => {
  const { location, updateLocation, getAqiColor } = useAirQuality();
  const [mapData, setMapData] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapView, setMapView] = useState('heatmap'); // heatmap, stations, both
  const [loading, setLoading] = useState(true);

  // Mock air quality monitoring stations
  const generateMockStations = () => {
    const stations = [];
    const baseLocations = [
      { name: 'Downtown NYC', lat: 40.7589, lng: -73.9851 },
      { name: 'Central Park', lat: 40.7829, lng: -73.9654 },
      { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969 },
      { name: 'Times Square', lat: 40.7580, lng: -73.9855 },
      { name: 'Wall Street', lat: 40.7074, lng: -74.0113 },
      { name: 'Harlem', lat: 40.8176, lng: -73.9482 },
      { name: 'Queens', lat: 40.7282, lng: -73.7949 },
      { name: 'Bronx', lat: 40.8448, lng: -73.8648 },
      { name: 'Staten Island', lat: 40.5795, lng: -74.1502 },
      { name: 'JFK Airport', lat: 40.6413, lng: -73.7781 }
    ];

    baseLocations.forEach((loc, index) => {
      const aqi = Math.floor(Math.random() * 150) + 25;
      stations.push({
        id: index,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        aqi: aqi,
        pm25: Math.random() * 50 + 10,
        pm10: Math.random() * 80 + 20,
        no2: Math.random() * 100 + 20,
        o3: Math.random() * 120 + 30,
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    });

    return stations;
  };

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setMapData(generateMockStations());
      setLoading(false);
    }, 1000);
  }, []);

  const createCustomIcon = (aqi) => {
    const color = getAqiColor(aqi);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: ${aqi > 100 ? 'white' : 'black'};
        ">
          ${aqi}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const getAqiLabel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    updateLocation({
      lat: lat,
      lng: lng,
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    });
  };

  if (loading) {
    return (
      <div className="map-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading air quality map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="map-title">
          <h1>🗺️ Air Quality Map</h1>
          <p>Real-time air quality monitoring stations</p>
        </div>
        
        <div className="map-controls">
          <div className="view-selector">
            <button 
              className={mapView === 'stations' ? 'active' : ''}
              onClick={() => setMapView('stations')}
            >
              Stations
            </button>
            <button 
              className={mapView === 'heatmap' ? 'active' : ''}
              onClick={() => setMapView('heatmap')}
            >
              Heatmap
            </button>
            <button 
              className={mapView === 'both' ? 'active' : ''}
              onClick={() => setMapView('both')}
            >
              Both
            </button>
          </div>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          onClick={handleMapClick}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Current location marker */}
          <Marker position={[location.lat, location.lng]}>
            <Popup>
              <div className="popup-content">
                <h3>📍 Your Location</h3>
                <p>{location.name}</p>
              </div>
            </Popup>
          </Marker>

          {/* Air quality stations */}
          {(mapView === 'stations' || mapView === 'both') && mapData.map(station => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createCustomIcon(station.aqi)}
              eventHandlers={{
                click: () => setSelectedStation(station)
              }}
            >
              <Popup>
                <div className="station-popup">
                  <h3>{station.name}</h3>
                  <div className="aqi-info">
                    <span 
                      className="aqi-badge"
                      style={{ backgroundColor: getAqiColor(station.aqi) }}
                    >
                      AQI {station.aqi}
                    </span>
                    <span className="aqi-label">
                      {getAqiLabel(station.aqi)}
                    </span>
                  </div>
                  <div className="pollutant-details">
                    <div>PM2.5: {station.pm25.toFixed(1)} μg/m³</div>
                    <div>PM10: {station.pm10.toFixed(1)} μg/m³</div>
                    <div>NO₂: {station.no2.toFixed(1)} μg/m³</div>
                    <div>O₃: {station.o3.toFixed(1)} μg/m³</div>
                  </div>
                  <div className="last-updated">
                    Updated: {new Date(station.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Heatmap circles */}
          {(mapView === 'heatmap' || mapView === 'both') && mapData.map(station => (
            <Circle
              key={`circle-${station.id}`}
              center={[station.lat, station.lng]}
              radius={station.aqi * 50} // Radius based on AQI
              fillColor={getAqiColor(station.aqi)}
              fillOpacity={0.3}
              stroke={false}
            />
          ))}
        </MapContainer>
      </div>

      <div className="map-sidebar">
        <div className="legend">
          <h3>AQI Legend</h3>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#00e400' }}></div>
              <span>0-50 Good</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ffff00' }}></div>
              <span>51-100 Moderate</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ff7e00' }}></div>
              <span>101-150 Unhealthy for Sensitive</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ff0000' }}></div>
              <span>151-200 Unhealthy</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#8f3f97' }}></div>
              <span>201-300 Very Unhealthy</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#7e0023' }}></div>
              <span>301+ Hazardous</span>
            </div>
          </div>
        </div>

        {selectedStation && (
          <div className="station-details">
            <h3>Station Details</h3>
            <div className="station-info">
              <h4>{selectedStation.name}</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">AQI</span>
                  <span 
                    className="value aqi-value"
                    style={{ color: getAqiColor(selectedStation.aqi) }}
                  >
                    {selectedStation.aqi}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Status</span>
                  <span className="value">{getAqiLabel(selectedStation.aqi)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">PM2.5</span>
                  <span className="value">{selectedStation.pm25.toFixed(1)} μg/m³</span>
                </div>
                <div className="detail-item">
                  <span className="label">PM10</span>
                  <span className="value">{selectedStation.pm10.toFixed(1)} μg/m³</span>
                </div>
                <div className="detail-item">
                  <span className="label">NO₂</span>
                  <span className="value">{selectedStation.no2.toFixed(1)} μg/m³</span>
                </div>
                <div className="detail-item">
                  <span className="label">O₃</span>
                  <span className="value">{selectedStation.o3.toFixed(1)} μg/m³</span>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => updateLocation({
                  lat: selectedStation.lat,
                  lng: selectedStation.lng,
                  name: selectedStation.name
                })}
              >
                Set as Location
              </button>
            </div>
          </div>
        )}

        <div className="map-stats">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{mapData.length}</span>
              <span className="stat-label">Monitoring Stations</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.round(mapData.reduce((sum, station) => sum + station.aqi, 0) / mapData.length)}
              </span>
              <span className="stat-label">Average AQI</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.max(...mapData.map(s => s.aqi))}
              </span>
              <span className="stat-label">Highest AQI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;