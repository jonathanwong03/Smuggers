import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import './Navigation.css';

const Navigation = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications } = useNotification();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/map', label: 'Map', icon: '🗺️' },
    { path: '/alerts', label: 'Alerts', icon: '🔔' },
    { path: '/health', label: 'Health', icon: '💚' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>🌤️ AirQ</h1>
      </div>
      
      <div className="nav-links">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.path === '/alerts' && unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="nav-controls">
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;