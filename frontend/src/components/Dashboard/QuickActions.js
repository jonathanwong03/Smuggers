import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import './QuickActions.css';

const QuickActions = ({ currentAqi }) => {
  const { addNotification, requestNotificationPermission } = useNotification();

  const getRecommendations = (aqi) => {
    if (aqi <= 50) {
      return [
        { icon: '🏃‍♂️', text: 'Great for outdoor exercise', action: 'exercise' },
        { icon: '🪟', text: 'Open windows for fresh air', action: 'ventilate' },
        { icon: '🌱', text: 'Perfect for gardening', action: 'garden' }
      ];
    } else if (aqi <= 100) {
      return [
        { icon: '🚶‍♂️', text: 'Light outdoor activities OK', action: 'walk' },
        { icon: '😷', text: 'Consider mask for sensitive groups', action: 'mask' },
        { icon: '🏠', text: 'Keep windows closed during peak hours', action: 'close' }
      ];
    } else if (aqi <= 150) {
      return [
        { icon: '🏠', text: 'Stay indoors if sensitive', action: 'indoor' },
        { icon: '😷', text: 'Wear mask outdoors', action: 'mask' },
        { icon: '💨', text: 'Use air purifier', action: 'purify' }
      ];
    } else {
      return [
        { icon: '🚫', text: 'Avoid outdoor activities', action: 'avoid' },
        { icon: '😷', text: 'Wear N95 mask if going out', action: 'n95' },
        { icon: '🏠', text: 'Stay indoors with air purifier', action: 'shelter' }
      ];
    }
  };

  const quickActions = [
    { 
      icon: '🔔', 
      text: 'Set Alert', 
      action: () => {
        requestNotificationPermission().then(granted => {
          if (granted) {
            addNotification({
              title: 'Alert Set',
              message: 'You will be notified when AQI changes significantly',
              type: 'success'
            });
          }
        });
      }
    },
    { 
      icon: '📊', 
      text: 'Export Data', 
      action: () => {
        const data = {
          timestamp: new Date().toISOString(),
          aqi: currentAqi,
          recommendations: getRecommendations(currentAqi)
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `air-quality-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    { 
      icon: '📱', 
      text: 'Share', 
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: 'Air Quality Update',
            text: `Current AQI is ${currentAqi}. Check out the air quality in your area!`,
            url: window.location.href
          });
        } else {
          navigator.clipboard.writeText(
            `Current AQI is ${currentAqi}. Check it out: ${window.location.href}`
          );
          addNotification({
            title: 'Copied to clipboard',
            message: 'Air quality info copied to clipboard',
            type: 'success'
          });
        }
      }
    },
    { 
      icon: '🔄', 
      text: 'Refresh', 
      action: () => {
        window.location.reload();
      }
    }
  ];

  const recommendations = getRecommendations(currentAqi);

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      
      <div className="actions-grid">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="action-button"
            onClick={action.action}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-text">{action.text}</span>
          </button>
        ))}
      </div>

      <div className="recommendations">
        <h4>Recommendations</h4>
        <div className="recommendation-list">
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="rec-icon">{rec.icon}</span>
              <span className="rec-text">{rec.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="health-tips">
        <h4>Health Tips</h4>
        <div className="tips-list">
          <div className="tip-item">
            💡 <strong>Did you know?</strong> PM2.5 particles are so small they can penetrate deep into your lungs and bloodstream.
          </div>
          <div className="tip-item">
            🌱 <strong>Indoor plants</strong> like spider plants and peace lilies can help improve indoor air quality.
          </div>
          <div className="tip-item">
            🚗 <strong>Reduce emissions</strong> by walking, cycling, or using public transport when possible.
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;