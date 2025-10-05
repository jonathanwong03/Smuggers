import React, { useState, useRef, useEffect } from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './LocationSelector.css';

const LocationSelector = () => {
  const { location, updateLocation, getCurrentLocation } = useAirQuality();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);

  // All 50 US States + DC
  const usStates = [
    { name: 'Alabama', lat: 32.806671, lng: -86.791130, abbr: 'AL' },
    { name: 'Alaska', lat: 61.370716, lng: -152.404419, abbr: 'AK' },
    { name: 'Arizona', lat: 33.729759, lng: -111.431221, abbr: 'AZ' },
    { name: 'Arkansas', lat: 34.969704, lng: -92.373123, abbr: 'AR' },
    { name: 'California', lat: 36.116203, lng: -119.681564, abbr: 'CA' },
    { name: 'Colorado', lat: 39.059811, lng: -105.311104, abbr: 'CO' },
    { name: 'Connecticut', lat: 41.597782, lng: -72.755371, abbr: 'CT' },
    { name: 'Delaware', lat: 39.318523, lng: -75.507141, abbr: 'DE' },
    { name: 'District of Columbia', lat: 38.897438, lng: -77.026817, abbr: 'DC' },
    { name: 'Florida', lat: 27.766279, lng: -81.686783, abbr: 'FL' },
    { name: 'Georgia', lat: 33.040619, lng: -83.643074, abbr: 'GA' },
    { name: 'Hawaii', lat: 21.094318, lng: -157.498337, abbr: 'HI' },
    { name: 'Idaho', lat: 44.240459, lng: -114.478828, abbr: 'ID' },
    { name: 'Illinois', lat: 40.349457, lng: -88.986137, abbr: 'IL' },
    { name: 'Indiana', lat: 39.849426, lng: -86.258278, abbr: 'IN' },
    { name: 'Iowa', lat: 42.011539, lng: -93.210526, abbr: 'IA' },
    { name: 'Kansas', lat: 38.526600, lng: -96.726486, abbr: 'KS' },
    { name: 'Kentucky', lat: 37.668140, lng: -84.670067, abbr: 'KY' },
    { name: 'Louisiana', lat: 31.169546, lng: -91.867805, abbr: 'LA' },
    { name: 'Maine', lat: 44.693947, lng: -69.381927, abbr: 'ME' },
    { name: 'Maryland', lat: 39.063946, lng: -76.802101, abbr: 'MD' },
    { name: 'Massachusetts', lat: 42.230171, lng: -71.530106, abbr: 'MA' },
    { name: 'Michigan', lat: 43.326618, lng: -84.536095, abbr: 'MI' },
    { name: 'Minnesota', lat: 45.694454, lng: -93.900192, abbr: 'MN' },
    { name: 'Mississippi', lat: 32.741646, lng: -89.678696, abbr: 'MS' },
    { name: 'Missouri', lat: 38.456085, lng: -92.288368, abbr: 'MO' },
    { name: 'Montana', lat: 46.921925, lng: -110.454353, abbr: 'MT' },
    { name: 'Nebraska', lat: 41.125370, lng: -98.268082, abbr: 'NE' },
    { name: 'Nevada', lat: 38.313515, lng: -117.055374, abbr: 'NV' },
    { name: 'New Hampshire', lat: 43.452492, lng: -71.563896, abbr: 'NH' },
    { name: 'New Jersey', lat: 40.298904, lng: -74.521011, abbr: 'NJ' },
    { name: 'New Mexico', lat: 34.840515, lng: -106.248482, abbr: 'NM' },
    { name: 'New York', lat: 42.165726, lng: -74.948051, abbr: 'NY' },
    { name: 'North Carolina', lat: 35.630066, lng: -79.806419, abbr: 'NC' },
    { name: 'North Dakota', lat: 47.528912, lng: -99.784012, abbr: 'ND' },
    { name: 'Ohio', lat: 40.388783, lng: -82.764915, abbr: 'OH' },
    { name: 'Oklahoma', lat: 35.565342, lng: -96.928917, abbr: 'OK' },
    { name: 'Oregon', lat: 44.572021, lng: -122.070938, abbr: 'OR' },
    { name: 'Pennsylvania', lat: 40.590752, lng: -77.209755, abbr: 'PA' },
    { name: 'Rhode Island', lat: 41.680893, lng: -71.511780, abbr: 'RI' },
    { name: 'South Carolina', lat: 33.856892, lng: -80.945007, abbr: 'SC' },
    { name: 'South Dakota', lat: 44.299782, lng: -99.438828, abbr: 'SD' },
    { name: 'Tennessee', lat: 35.747845, lng: -86.692345, abbr: 'TN' },
    { name: 'Texas', lat: 31.054487, lng: -97.563461, abbr: 'TX' },
    { name: 'Utah', lat: 40.150032, lng: -111.862434, abbr: 'UT' },
    { name: 'Vermont', lat: 44.045876, lng: -72.710686, abbr: 'VT' },
    { name: 'Virginia', lat: 37.769337, lng: -78.169968, abbr: 'VA' },
    { name: 'Washington', lat: 47.400902, lng: -121.490494, abbr: 'WA' },
    { name: 'West Virginia', lat: 38.491226, lng: -80.954456, abbr: 'WV' },
    { name: 'Wisconsin', lat: 44.268543, lng: -89.616508, abbr: 'WI' },
    { name: 'Wyoming', lat: 42.755966, lng: -107.302490, abbr: 'WY' }
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
    if (searchTerm.length > 0) {
      // Filter states based on search
      const filtered = usStates.filter(state =>
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.abbr.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      // Show all states
      setSuggestions(usStates);
    }
  }, [searchTerm]);

  const handleLocationSelect = (selectedState) => {
    updateLocation({
      name: selectedState.name,
      lat: selectedState.lat,
      lng: selectedState.lng,
      type: 'state',
      abbr: selectedState.abbr
    });
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
        <span className="location-text">{location.name || 'Select State'}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="location-dropdown">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="location-search"
              autoFocus
            />
          </div>

          <div className="suggestions-section">
            <div className="section-title">
              {searchTerm.length > 0 ? 'Search Results' : 'All States'}
            </div>
            
            {suggestions.length === 0 && (
              <div className="no-results">No states found</div>
            )}
            
            {suggestions.map((state, index) => (
              <button
                key={index}
                className="location-suggestion"
                onClick={() => handleLocationSelect(state)}
              >
                <span className="location-icon">📍</span>
                <div className="location-details">
                  <span className="location-name">{state.name}</span>
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