import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAirQuality } from '../../contexts/AirQualityContext';
import './AlertsPage.css';

const AlertsPage = () => {
  const { 
    notifications, 
    alertSettings, 
    updateAlertSettings, 
    clearAllNotifications,
    requestNotificationPermission 
  } = useNotification();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('notifications');

  const handleSettingsUpdate = (field, value) => {
    updateAlertSettings({ [field]: value });
  };

  const testNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      addNotification({
        title: 'Test Alert',
        message: 'This is a test notification. Your alerts are working!',
        type: 'info'
      });
    } else {
      addNotification({
        title: 'Permission Denied',
        message: 'Please enable notifications in your browser settings.',
        type: 'warning'
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '🚨';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>🔔 Alerts & Notifications</h1>
        <p>Manage your air quality alerts and notification preferences</p>
      </div>

      <div className="alerts-tabs">
        <button 
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications ({notifications.length})
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Alert Settings
        </button>
        <button 
          className={activeTab === 'subscriptions' ? 'active' : ''}
          onClick={() => setActiveTab('subscriptions')}
        >
          Subscriptions
        </button>
      </div>

      <div className="alerts-content">
        {activeTab === 'notifications' && (
          <div className="notifications-tab">
            <div className="notifications-header">
              <h2>Recent Notifications</h2>
              <div className="notifications-actions">
                <button className="btn btn-secondary" onClick={testNotification}>
                  Test Notification
                </button>
                <button className="btn btn-secondary" onClick={clearAllNotifications}>
                  Clear All
                </button>
              </div>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔕</div>
                  <h3>No notifications yet</h3>
                  <p>You'll see air quality alerts and updates here</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div key={notification.id} className={`notification-item ${notification.type}`}>
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-section">
              <h2>Alert Preferences</h2>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Enable Alerts</h3>
                  <p>Receive notifications when air quality changes</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={alertSettings.enabled}
                    onChange={(e) => handleSettingsUpdate('enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Push Notifications</h3>
                  <p>Show browser notifications for alerts</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={alertSettings.pushEnabled}
                    onChange={(e) => handleSettingsUpdate('pushEnabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Alert Threshold</h3>
                  <p>Notify when AQI exceeds this value</p>
                </div>
                <div className="threshold-control">
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={alertSettings.threshold}
                    onChange={(e) => handleSettingsUpdate('threshold', parseInt(e.target.value))}
                    className="threshold-slider"
                  />
                  <span className="threshold-value">{alertSettings.threshold}</span>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Notifications</h3>
                  <p>Receive alerts via email</p>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={alertSettings.email}
                  onChange={(e) => handleSettingsUpdate('email', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="subscriptions-tab">
            <div className="subscription-section">
              <h2>Location Subscriptions</h2>
              <p>Get alerts for multiple locations</p>
              
              <div className="subscription-list">
                <div className="subscription-item">
                  <div className="subscription-info">
                    <h3>📍 Current Location</h3>
                    <p>New York, NY</p>
                  </div>
                  <div className="subscription-status active">
                    Active
                  </div>
                </div>
                
                <div className="add-subscription">
                  <button className="btn btn-primary">
                    + Add Location
                  </button>
                </div>
              </div>
            </div>

            <div className="alert-types-section">
              <h2>Alert Types</h2>
              
              <div className="alert-type-list">
                <div className="alert-type-item">
                  <div className="alert-type-info">
                    <h3>🚨 High AQI Alerts</h3>
                    <p>When air quality becomes unhealthy</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="alert-type-item">
                  <div className="alert-type-info">
                    <h3>📈 Trend Alerts</h3>
                    <p>When air quality is rapidly changing</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="alert-type-item">
                  <div className="alert-type-info">
                    <h3>🌅 Daily Forecasts</h3>
                    <p>Morning air quality summary</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;