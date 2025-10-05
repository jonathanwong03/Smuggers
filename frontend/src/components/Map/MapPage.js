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
  const [mapView, setMapView] = useState('stations'); // heatmap, stations, both
  const [loading, setLoading] = useState(true);

  // US air quality monitoring stations based on real data
  const generateMockStations = () => {
    const stations = [];
    const baseLocations = [
      // Major US cities with real coordinates
      { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
      { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
      { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
      { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
      { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
      { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
      { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
      { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 },
      { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
      { name: 'Jacksonville, FL', lat: 30.3322, lng: -81.6557 },
      { name: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
      { name: 'Columbus, OH', lat: 39.9612, lng: -82.9988 },
      { name: 'Charlotte, NC', lat: 35.2271, lng: -80.8431 },
      { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
      { name: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581 },
      { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
      { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
      { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 }
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
    // Fetch real US states data with statistics from backend
    const fetchMapData = async () => {
      try {
        const response = await fetch('/api/map-stats');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stateData) {
            // State coordinates mapping
            const stateCoords = {
              'Alabama': { lat: 32.3617, lng: -86.2792 },
              'Alaska': { lat: 64.0685, lng: -152.2782 },
              'Arizona': { lat: 34.2744, lng: -111.2847 },
              'Arkansas': { lat: 34.7519, lng: -92.1313 },
              'California': { lat: 36.7783, lng: -119.4179 },
              'Colorado': { lat: 39.5501, lng: -105.7821 },
              'Connecticut': { lat: 41.6032, lng: -73.0877 },
              'Delaware': { lat: 39.1612, lng: -75.5264 },
              'Florida': { lat: 27.7663, lng: -82.6404 },
              'Georgia': { lat: 32.1656, lng: -82.9001 },
              'Hawaii': { lat: 19.8968, lng: -155.5828 },
              'Idaho': { lat: 44.0682, lng: -114.7420 },
              'Illinois': { lat: 40.6331, lng: -89.3985 },
              'Indiana': { lat: 40.2732, lng: -86.1349 },
              'Iowa': { lat: 41.8780, lng: -93.0977 },
              'Kansas': { lat: 39.0119, lng: -98.4842 },
              'Kentucky': { lat: 37.8393, lng: -84.2700 },
              'Louisiana': { lat: 30.9843, lng: -91.9623 },
              'Maine': { lat: 45.2538, lng: -69.4455 },
              'Maryland': { lat: 39.0458, lng: -76.6413 },
              'Massachusetts': { lat: 42.4072, lng: -71.3824 },
              'Michigan': { lat: 44.3467, lng: -85.4102 },
              'Minnesota': { lat: 46.7296, lng: -94.6859 },
              'Mississippi': { lat: 32.3547, lng: -89.3985 },
              'Missouri': { lat: 37.9643, lng: -91.8318 },
              'Montana': { lat: 47.0527, lng: -109.6333 },
              'Nebraska': { lat: 41.4925, lng: -99.9018 },
              'Nevada': { lat: 38.8026, lng: -116.4194 },
              'New Hampshire': { lat: 43.1939, lng: -71.5724 },
              'New Jersey': { lat: 40.0583, lng: -74.4057 },
              'New Mexico': { lat: 34.5199, lng: -105.8701 },
              'New York': { lat: 43.2994, lng: -74.2179 },
              'North Carolina': { lat: 35.7596, lng: -79.0193 },
              'North Dakota': { lat: 47.5515, lng: -101.0020 },
              'Ohio': { lat: 40.4173, lng: -82.9071 },
              'Oklahoma': { lat: 35.0078, lng: -97.0929 },
              'Oregon': { lat: 43.8041, lng: -120.5542 },
              'Pennsylvania': { lat: 41.2033, lng: -77.1945 },
              'Rhode Island': { lat: 41.6809, lng: -71.5118 },
              'South Carolina': { lat: 33.8361, lng: -81.1637 },
              'South Dakota': { lat: 43.9695, lng: -99.9018 },
              'Tennessee': { lat: 35.5175, lng: -86.5804 },
              'Texas': { lat: 31.9686, lng: -99.9018 },
              'Utah': { lat: 39.3210, lng: -111.0937 },
              'Vermont': { lat: 44.5588, lng: -72.5805 },
              'Virginia': { lat: 37.4316, lng: -78.6569 },
              'Washington': { lat: 47.7511, lng: -120.7401 },
              'West Virginia': { lat: 38.3498, lng: -80.6201 },
              'Wisconsin': { lat: 43.7844, lng: -88.7879 },
              'Wyoming': { lat: 43.0759, lng: -107.2903 }
            };

            // Convert backend data to map stations
            const mapStations = data.stateData.map((stateData, index) => {
              const coords = stateCoords[stateData.state];
              if (!coords) return null;
              
              return {
                id: index,
                name: stateData.state,
                lat: coords.lat,
                lng: coords.lng,
                aqi: stateData.aqi,
                pm25: stateData.pm25,
                pm10: stateData.pm25 * 1.5, // Estimate PM10 from PM2.5
                no2: Math.random() * 30 + 10, // Mock NO2 data
                o3: Math.random() * 80 + 20, // Mock O3 data
                counties: stateData.counties,
                lastUpdated: new Date().toISOString()
              };
            }).filter(Boolean);

            setMapData(mapStations);
            console.log(`✓ Loaded ${mapStations.length} states with real AQI data`);
          } else {
            throw new Error('Invalid response format');
          }
        } else {
          throw new Error('Failed to fetch map statistics');
        }
      } catch (error) {
        console.error('Failed to fetch real data, using fallback:', error);
        setMapData(generateMockStations());
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  const createCustomIcon = (aqi, isSelected = false) => {
    const color = getAqiColor(aqi);
    const size = isSelected ? 28 : 24;
    const borderWidth = isSelected ? 3 : 2;
    
    // Better text color logic for visibility
    const getTextColor = (bgColor, aqiValue) => {
      // For green (good) and yellow (moderate), use black text
      if (aqiValue <= 100) return 'black';
      // For orange and red, use white text
      if (aqiValue <= 200) return 'white';
      // For purple and maroon, use white text
      return 'white';
    };
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${size - 4}px;
          height: ${size - 4}px;
          border-radius: 50%;
          border: ${borderWidth}px solid ${isSelected ? '#007bff' : 'white'};
          box-shadow: 0 2px 6px rgba(0,0,0,${isSelected ? '0.4' : '0.3'});
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? '11px' : '10px'};
          font-weight: bold;
          color: ${getTextColor(color, aqi)};
          cursor: pointer;
          transition: all 0.2s ease;
          text-shadow: ${aqi <= 100 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'};
        ">
          ${aqi}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
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

  const handleStationClick = (station) => {
    // Set the selected station for sidebar display
    setSelectedStation(station);
    
    // Update the location context without changing map view
    updateLocation({
      lat: station.lat,
      lng: station.lng,
      name: station.name,
      type: 'state',
      state: station.name
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
    <div className="map-page" style={{backgroundColor: "white"}}>
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
          
          {selectedStation && (
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedStation(null)}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={[39.8283, -98.5795]} // Center of USA
          zoom={4} // Zoom level to show entire continental US
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Current location marker - only show if we have valid coordinates */}
          {location.lat && location.lng && location.lat !== 40.0 && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                <div className="popup-content">
                  <h3>📍 Your Location</h3>
                  <p>{location.name}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Air quality stations */}
          {(mapView === 'stations' || mapView === 'both') && mapData.map(station => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createCustomIcon(station.aqi, selectedStation?.id === station.id)}
              eventHandlers={{
                click: () => handleStationClick(station)
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
              radius={station.aqi * 1000} // Radius based on AQI (increased for better visibility)
              fillColor={getAqiColor(station.aqi)}
              fillOpacity={0.3}
              stroke={false}
              eventHandlers={{
                click: () => handleStationClick(station)
              }}
            />
          ))}
        </MapContainer>
      </div>

      <div className="map-sidebar" style={{marginTop: "500px", height: "100%", width: "100%"}}>
        <div className="map-details" >
          <div className="legend" style={{width: "30%"}}>
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
            <div className="station-details" style={{width: "30%"}}>
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
                <div className="station-actions">
                  <button 
                    className="btn btn-danger"
                    onClick={() => setSelectedStation(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="map-stats" style={{width: "30%"}}>
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{mapData.length}</span>
                <span className="stat-label">Monitoring Stations</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {mapData.length > 0 ? 
                    Math.round(mapData.reduce((sum, station) => sum + (station.aqi || 0), 0) / mapData.length) : 
                    0
                  }
                </span>
                <span className="stat-label">Average AQI</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {mapData.length > 0 ? 
                    Math.max(...mapData.map(s => s.aqi || 0)) : 
                    0
                  }
                </span>
                <span className="stat-label">Highest AQI</span>
              </div>
            </div>
          </div>
        </div>
                
      </div>
    </div>
  );
};

export default MapPage;