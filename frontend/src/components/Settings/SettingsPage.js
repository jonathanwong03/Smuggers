import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { alertSettings, updateAlertSettings } = useNotification();
  const [settings, setSettings] = useState({
    units: 'metric', // metric, imperial
    language: 'en',
    autoRefresh: true,
    refreshInterval: 5, // minutes
    showForecast: true,
    compactView: false,
    highContrast: false,
    dataRetention: 30 // days
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportData = () => {
    const data = {
      settings,
      alertSettings,
      theme: isDarkMode ? 'dark' : 'light',
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airq-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        units: 'metric',
        language: 'en',
        autoRefresh: true,
        refreshInterval: 5,
        showForecast: true,
        compactView: false,
        highContrast: false,
        dataRetention: 30
      });
      updateAlertSettings({
        enabled: false,
        threshold: 100,
        email: '',
        pushEnabled: false
      });
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Customize your air quality monitoring experience</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>🎨 Appearance</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Dark Mode</h3>
              <p>Switch between light and dark themes</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleTheme}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>High Contrast</h3>
              <p>Increase contrast for better accessibility</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Compact View</h3>
              <p>Show more information in less space</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.compactView}
                onChange={(e) => handleSettingChange('compactView', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>📊 Data & Display</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Units</h3>
              <p>Choose measurement units</p>
            </div>
            <select
              value={settings.units}
              onChange={(e) => handleSettingChange('units', e.target.value)}
              className="form-control"
            >
              <option value="metric">Metric (°C, μg/m³)</option>
              <option value="imperial">Imperial (°F, ppm)</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Language</h3>
              <p>Select your preferred language</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="form-control"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Show Forecast</h3>
              <p>Display air quality forecast charts</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showForecast}
                onChange={(e) => handleSettingChange('showForecast', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>🔄 Data Refresh</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Auto Refresh</h3>
              <p>Automatically update air quality data</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Refresh Interval</h3>
              <p>How often to update data (minutes)</p>
            </div>
            <select
              value={settings.refreshInterval}
              onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              className="form-control"
              disabled={!settings.autoRefresh}
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Data Retention</h3>
              <p>How long to keep historical data (days)</p>
            </div>
            <select
              value={settings.dataRetention}
              onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
              className="form-control"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>🔔 Notifications</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Enable Alerts</h3>
              <p>Receive air quality alerts</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={alertSettings.enabled}
                onChange={(e) => updateAlertSettings({ enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Alert Threshold</h3>
              <p>AQI level that triggers alerts</p>
            </div>
            <div className="threshold-control">
              <input
                type="range"
                min="50"
                max="300"
                value={alertSettings.threshold}
                onChange={(e) => updateAlertSettings({ threshold: parseInt(e.target.value) })}
                className="threshold-slider"
                disabled={!alertSettings.enabled}
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
              onChange={(e) => updateAlertSettings({ email: e.target.value })}
              className="form-control"
              disabled={!alertSettings.enabled}
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>💾 Data Management</h2>
          
          <div className="setting-actions">
            <button className="btn btn-secondary" onClick={exportData}>
              📤 Export Settings
            </button>
            <button className="btn btn-secondary">
              📥 Import Settings
            </button>
            <button className="btn btn-secondary">
              🗑️ Clear Cache
            </button>
            <button className="btn btn-secondary" onClick={resetSettings}>
              🔄 Reset to Defaults
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h2>ℹ️ About</h2>
          
          <div className="about-info">
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Data Source</span>
              <span className="info-value">NASA TEMPO</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="about-links">
            <a href="#" className="about-link">Privacy Policy</a>
            <a href="#" className="about-link">Terms of Service</a>
            <a href="#" className="about-link">Help & Support</a>
            <a href="#" className="about-link">Report an Issue</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;