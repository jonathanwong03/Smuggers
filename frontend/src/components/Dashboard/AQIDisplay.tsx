import React from 'react';
import { Card, Progress } from 'antd';

interface AQIDisplayProps {
  aqi: number;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
}

export const AQIDisplay: React.FC<AQIDisplayProps> = ({ aqi, pollutants }) => {
  const getAQIColor = (value: number) => {
    if (value <= 50) return '#52c41a';
    if (value <= 100) return '#faad14';
    return '#f5222d';
  };

  return (
    <Card title="Current Air Quality">
      <div className="aqi-value" style={{ color: getAQIColor(aqi) }}>
        {aqi}
      </div>
      <div className="pollutants-grid">
        {Object.entries(pollutants).map(([key, value]) => (
          <Progress
            key={key}
            type="dashboard"
            percent={value}
            format={percent => `${key.toUpperCase()}: ${percent}`}
          />
        ))}
      </div>
    </Card>
  );
};
