import React, { useState, useRef, useEffect } from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './LocationSelector.css';

const LocationSelector = () => {
  const { location, updateLocation, getCurrentLocation } = useAirQuality();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);

  const [availableStates, setAvailableStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);

  const popularLocations = [
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060, type: 'city' },
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, type: 'city' },
    { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, type: 'city' },
    { name: 'Houston, TX', lat: 29.7604, lng: -95.3698, type: 'city' },
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, type: 'city' },
    { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652, type: 'city' },
    { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936, type: 'city' },
    { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611, type: 'city' }
  ];

  // Load available states from backend
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch('/api/states');
        const data = await response.json();
        if (data.success) {
          setAvailableStates(data.states.slice(0, 20)); // Limit to first 20 states
        }
      } catch (error) {
        console.error('Failed to fetch states:', error);
      } finally {
        setLoadingStates(false);
      }
    };

    if (isOpen && availableStates.length === 0) {
      fetchStates();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      // Filter both cities and states
      const filteredCities = popularLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const filteredStates = availableStates.filter(state =>
        state.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(state => ({
        name: state.name,
        type: 'state',
        counties: state.counties
      }));
      
      setSuggestions([...filteredCities, ...filteredStates].slice(0, 10));
    } else {
      // Show mix of cities and states
      const cityOptions = popularLocations.slice(0, 3);
      const stateOptions = availableStates.slice(0, 5).map(state => ({
        name: state.name,
        type: 'state',
        counties: state.counties
      }));
      setSuggestions([...cityOptions, ...stateOptions]);
    }
  }, [searchTerm, availableStates]);

  const handleLocationSelect = (selectedLocation) => {
    if (selectedLocation.type === 'state') {
      // For states, we'll use a default coordinate and pass the state name
      updateLocation({
        lat: 40.0, // Default lat
        lng: -100.0, // Default lng
        name: selectedLocation.name,
        type: 'state',
        state: selectedLocation.name
      });
    } else {
      updateLocation(selectedLocation);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCurrentLocation = () => {
    getCurrentLocation();
    setIsOpen(false);
  };

  return (
    <div className="location-selector" ref={dropdownRef}>
      <button 
        className="location-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="location-icon">📍</span>
        <span className="location-text">{location.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="location-dropdown">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="location-search"
            />
          </div>

          <div className="current-location-section">
            <button 
              className="current-location-btn"
              onClick={handleCurrentLocation}
            >
              <span className="location-icon">🎯</span>
              Use Current Location
            </button>
          </div>

          <div className="suggestions-section">
            <div className="section-title">
              {searchTerm.length > 2 ? 'Search Results' : 'Popular Locations & States'}
            </div>
            {loadingStates && searchTerm.length <= 2 && (
              <div className="loading-states">Loading states...</div>
            )}
            {suggestions.map((loc, index) => (
              <button
                key={index}
                className="location-suggestion"
                onClick={() => handleLocationSelect(loc)}
              >
                <span className="location-icon">
                  {loc.type === 'state' ? '🏛️' : '📍'}
                </span>
                <div className="location-details">
                  <span className="location-name">{loc.name}</span>
                  {loc.type === 'state' && (
                    <span className="location-meta">
                      {loc.counties} counties
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;