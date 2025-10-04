import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AirQualityContext = createContext();

export const useAirQuality = () => {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error('useAirQuality must be used within an AirQualityProvider');
  }
  return context;
};

export const AirQualityProvider = ({ children }) => {
  const [airQuality, setAirQuality] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ lat: 39.8283, lng: -98.5795, name: 'United States' });
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return '#00e400'; // Good
    if (aqi <= 100) return '#ffff00'; // Moderate
    if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups
    if (aqi <= 200) return '#ff0000'; // Unhealthy
    if (aqi <= 300) return '#8f3f97'; // Very Unhealthy
    return '#7e0023'; // Hazardous
  };

  const getAqiLabel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const fetchAirQuality = async (lat = location.lat, lng = location.lng, state = location.state) => {
    try {
      setLoading(true);
      const params = {};
      
      if (state) {
        params.state = state;
      } else {
        params.lat = lat;
        params.lng = lng;
      }
      
      const response = await axios.get('/api/air-quality', { params });
      setAirQuality(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setAirQuality(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (lat = location.lat, lng = location.lng, hours = 24, state = location.state) => {
    try {
      const params = { hours };
      
      if (state) {
        params.state = state;
      } else {
        params.lat = lat;
        params.lng = lng;
      }
      
      const response = await axios.get('/api/forecast', { params });
      setForecast(response.data);
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    }
  };

  const updateLocation = (newLocation) => {
    setLocation(newLocation);
    if (newLocation.type === 'state') {
      fetchAirQuality(null, null, newLocation.state);
      fetchForecast(null, null, 24, newLocation.state);
    } else {
      fetchAirQuality(newLocation.lat, newLocation.lng);
      fetchForecast(newLocation.lat, newLocation.lng);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation({ lat: latitude, lng: longitude, name: 'Current Location' });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  useEffect(() => {
    fetchAirQuality();
    fetchForecast();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(() => {
      fetchAirQuality();
      fetchForecast();
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <AirQualityContext.Provider value={{
      airQuality,
      forecast,
      loading,
      error,
      location,
      selectedTimeRange,
      setSelectedTimeRange,
      getAqiColor,
      getAqiLabel,
      updateLocation,
      getCurrentLocation,
      fetchAirQuality,
      fetchForecast
    }}>
      {children}
    </AirQualityContext.Provider>
  );
};