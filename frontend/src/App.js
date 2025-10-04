import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import Navigation from './components/Navigation/Navigation';
import AlertsPage from './components/Alerts/AlertsPage';
import HealthPage from './components/Health/HealthPage';
import MapPage from './components/Map/MapPage';
import SettingsPage from './components/Settings/SettingsPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AirQualityProvider } from './contexts/AirQualityContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <ThemeProvider>
      <AirQualityProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Navigation />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/health" element={<HealthPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
            </div>
          </Router>
        </NotificationProvider>
      </AirQualityProvider>
    </ThemeProvider>
  );
}

export default App;
