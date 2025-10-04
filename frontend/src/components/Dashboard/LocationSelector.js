import React, { useState, useRef, useEffect } from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './LocationSelector.css';

const LocationSelector = () => {
  const { location, updateLocation, getCurrentLocation } = useAirQuality();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);

  const popularLocations = [
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 }
  ];

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
      const filtered = popularLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(popularLocations.slice(0, 5));
    }
  }, [searchTerm]);

  const handleLocationSelect = (selectedLocation) => {
    updateLocation(selectedLocation);
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
            <div className="section-title">Popular Locations</div>
            {suggestions.map((loc, index) => (
              <button
                key={index}
                className="location-suggestion"
                onClick={() => handleLocationSelect(loc)}
              >
                <span className="location-icon">📍</span>
                <span className="location-name">{loc.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;