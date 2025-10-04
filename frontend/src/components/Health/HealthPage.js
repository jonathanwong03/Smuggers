import React, { useState } from 'react';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './HealthPage.css';

const HealthPage = () => {
  const { airQuality, getAqiColor, getAqiLabel } = useAirQuality();
  const [selectedGroup, setSelectedGroup] = useState('general');

  const currentAqi = airQuality?.aqi || 75;

  const vulnerableGroups = [
    {
      id: 'general',
      name: 'General Population',
      icon: '👥',
      description: 'Healthy adults and children'
    },
    {
      id: 'children',
      name: 'Children',
      icon: '👶',
      description: 'Under 18 years old'
    },
    {
      id: 'elderly',
      name: 'Elderly',
      icon: '👴',
      description: '65 years and older'
    },
    {
      id: 'respiratory',
      name: 'Respiratory Conditions',
      icon: '🫁',
      description: 'Asthma, COPD, lung disease'
    },
    {
      id: 'heart',
      name: 'Heart Conditions',
      icon: '❤️',
      description: 'Heart disease, high blood pressure'
    },
    {
      id: 'pregnant',
      name: 'Pregnant Women',
      icon: '🤱',
      description: 'Expecting mothers'
    }
  ];

  const getHealthRecommendations = (aqi, group) => {
    const recommendations = {
      general: {
        good: [
          'Perfect day for outdoor activities and exercise',
          'Open windows to let fresh air in',
          'Great time for outdoor sports and recreation'
        ],
        moderate: [
          'Outdoor activities are generally safe',
          'Consider reducing prolonged outdoor exertion',
          'Monitor air quality if you notice symptoms'
        ],
        unhealthy: [
          'Limit outdoor activities, especially strenuous exercise',
          'Keep windows closed and use air conditioning',
          'Consider wearing a mask when outdoors'
        ],
        veryUnhealthy: [
          'Avoid outdoor activities',
          'Stay indoors with air purification',
          'Wear N95 mask if you must go outside'
        ]
      },
      children: {
        good: [
          'Great day for playground activities and outdoor sports',
          'Perfect for walking or biking to school',
          'Encourage outdoor play and activities'
        ],
        moderate: [
          'Outdoor activities are okay, but watch for symptoms',
          'Reduce time spent in heavy traffic areas',
          'Consider indoor alternatives for extended activities'
        ],
        unhealthy: [
          'Keep children indoors during peak pollution hours',
          'Limit outdoor school activities and sports',
          'Watch for coughing, wheezing, or breathing difficulties'
        ],
        veryUnhealthy: [
          'Keep children indoors at all times',
          'Cancel outdoor school activities',
          'Seek medical attention if breathing problems occur'
        ]
      },
      respiratory: {
        good: [
          'Safe for normal outdoor activities',
          'Good day to exercise outdoors',
          'Continue regular medication as prescribed'
        ],
        moderate: [
          'Monitor symptoms closely during outdoor activities',
          'Have rescue inhaler readily available',
          'Consider pre-medicating before outdoor exercise'
        ],
        unhealthy: [
          'Stay indoors and avoid outdoor exertion',
          'Use air purifiers and keep windows closed',
          'Have rescue medications easily accessible'
        ],
        veryUnhealthy: [
          'Remain indoors with air filtration',
          'Avoid all outdoor activities',
          'Contact healthcare provider if symptoms worsen'
        ]
      }
    };

    const level = aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 200 ? 'unhealthy' : 'veryUnhealthy';
    return recommendations[group]?.[level] || recommendations.general[level];
  };

  const getHealthRisk = (aqi, group) => {
    if (aqi <= 50) return { level: 'Low', color: '#4caf50' };
    if (aqi <= 100) return { level: group === 'general' ? 'Low' : 'Moderate', color: '#ff9800' };
    if (aqi <= 150) return { level: group === 'general' ? 'Moderate' : 'High', color: '#ff5722' };
    return { level: 'High', color: '#f44336' };
  };

  const pollutantInfo = {
    'PM2.5': {
      name: 'Fine Particulate Matter',
      description: 'Tiny particles that can penetrate deep into lungs and bloodstream',
      sources: 'Vehicle exhaust, industrial emissions, wildfires',
      healthEffects: 'Respiratory irritation, cardiovascular problems, reduced lung function'
    },
    'PM10': {
      name: 'Coarse Particulate Matter',
      description: 'Larger particles that can irritate airways',
      sources: 'Dust, pollen, construction activities',
      healthEffects: 'Eye and throat irritation, aggravated asthma'
    },
    'NO2': {
      name: 'Nitrogen Dioxide',
      description: 'Gas produced by combustion processes',
      sources: 'Vehicle emissions, power plants, industrial facilities',
      healthEffects: 'Respiratory inflammation, increased infection risk'
    },
    'O3': {
      name: 'Ground-level Ozone',
      description: 'Gas formed when pollutants react with sunlight',
      sources: 'Vehicle emissions, industrial activities, chemical solvents',
      healthEffects: 'Chest pain, coughing, throat irritation, airway inflammation'
    }
  };

  const healthTips = [
    {
      icon: '🏠',
      title: 'Indoor Air Quality',
      tips: [
        'Use HEPA air purifiers in main living areas',
        'Keep windows closed during high pollution days',
        'Avoid smoking and burning candles indoors',
        'Maintain humidity levels between 30-50%'
      ]
    },
    {
      icon: '🌱',
      title: 'Natural Protection',
      tips: [
        'Add air-purifying plants like spider plants and peace lilies',
        'Eat antioxidant-rich foods (berries, leafy greens)',
        'Stay hydrated to help your body process pollutants',
        'Consider vitamin C and E supplements'
      ]
    },
    {
      icon: '😷',
      title: 'Personal Protection',
      tips: [
        'Wear N95 or P100 masks during high pollution',
        'Avoid outdoor exercise during peak pollution hours',
        'Choose less polluted routes for walking/cycling',
        'Shower and change clothes after outdoor activities'
      ]
    }
  ];

  return (
    <div className="health-page">
      <div className="health-header">
        <h1>💚 Health Insights</h1>
        <p>Personalized health recommendations based on current air quality</p>
      </div>

      <div className="current-health-status">
        <div className="health-overview">
          <div className="aqi-health-display">
            <div 
              className="aqi-circle-small"
              style={{ borderColor: getAqiColor(currentAqi) }}
            >
              <span className="aqi-value-small">{currentAqi}</span>
            </div>
            <div className="aqi-health-info">
              <h2 style={{ color: getAqiColor(currentAqi) }}>
                {getAqiLabel(currentAqi)}
              </h2>
              <p>Current Air Quality Level</p>
            </div>
          </div>
          
          <div className="health-risk-badge">
            <span 
              className="risk-level"
              style={{ backgroundColor: getHealthRisk(currentAqi, selectedGroup).color }}
            >
              {getHealthRisk(currentAqi, selectedGroup).level} Risk
            </span>
          </div>
        </div>
      </div>

      <div className="vulnerable-groups">
        <h2>Select Your Health Profile</h2>
        <div className="groups-grid">
          {vulnerableGroups.map(group => (
            <button
              key={group.id}
              className={`group-card ${selectedGroup === group.id ? 'active' : ''}`}
              onClick={() => setSelectedGroup(group.id)}
            >
              <div className="group-icon">{group.icon}</div>
              <div className="group-info">
                <h3>{group.name}</h3>
                <p>{group.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="health-recommendations">
        <h2>Recommendations for {vulnerableGroups.find(g => g.id === selectedGroup)?.name}</h2>
        <div className="recommendations-list">
          {getHealthRecommendations(currentAqi, selectedGroup).map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="rec-icon">💡</div>
              <p>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pollutant-education">
        <h2>Understanding Air Pollutants</h2>
        <div className="pollutants-grid">
          {Object.entries(pollutantInfo).map(([key, info]) => (
            <div key={key} className="pollutant-card">
              <h3>{key} - {info.name}</h3>
              <p className="pollutant-description">{info.description}</p>
              <div className="pollutant-details">
                <div className="detail-section">
                  <strong>Sources:</strong>
                  <p>{info.sources}</p>
                </div>
                <div className="detail-section">
                  <strong>Health Effects:</strong>
                  <p>{info.healthEffects}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="health-tips-section">
        <h2>General Health Tips</h2>
        <div className="tips-grid">
          {healthTips.map((category, index) => (
            <div key={index} className="tip-category">
              <div className="tip-header">
                <span className="tip-icon">{category.icon}</span>
                <h3>{category.title}</h3>
              </div>
              <ul className="tip-list">
                {category.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthPage;