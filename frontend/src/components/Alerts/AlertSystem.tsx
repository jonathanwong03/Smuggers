import React, { useState } from 'react';
import { Card, Switch, Input, Button, message } from 'antd';
import { apiService } from '../../services/api';

export const AlertSystem: React.FC = () => {
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(false);

  const handleSubscribe = async () => {
    try {
      await apiService.subscribeToAlerts(email, { notifications });
      message.success('Successfully subscribed to alerts!');
    } catch (error) {
      message.error('Failed to subscribe to alerts');
    }
  };

  return (
    <Card title="Alert Settings">
      <Input 
        placeholder="Enter your email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <Switch 
        checkedChildren="Notifications On" 
        unCheckedChildren="Notifications Off"
        checked={notifications}
        onChange={setNotifications}
      />
      <Button onClick={handleSubscribe}>Subscribe to Alerts</Button>
    </Card>
  );
};
