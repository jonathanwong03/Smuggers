import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    enabled: false,
    threshold: 100,
    email: '',
    pushEnabled: false
  });

  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = { ...notification, id, timestamp: new Date() };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    
    // Show browser notification if enabled
    if (alertSettings.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const updateAlertSettings = (newSettings) => {
    setAlertSettings(prev => ({ ...prev, ...newSettings }));
    localStorage.setItem('alertSettings', JSON.stringify({ ...alertSettings, ...newSettings }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('alertSettings');
    if (saved) {
      setAlertSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      alertSettings,
      addNotification,
      removeNotification,
      clearAllNotifications,
      requestNotificationPermission,
      updateAlertSettings
    }}>
      {children}
    </NotificationContext.Provider>
  );
};