import React from 'react';
import { Card, Alert } from 'antd';

interface HealthInsightsProps {
  aqi: number;
}

export const HealthInsights: React.FC<HealthInsightsProps> = ({ aqi }) => {
  const getHealthRecommendation = (aqi: number) => {
    if (aqi <= 50) return { type: 'success', message: 'Air quality is good. Perfect for outdoor activities!' };
    if (aqi <= 100) return { type: 'warning', message: 'Sensitive individuals should limit outdoor exposure.' };
    return { type: 'error', message: 'Avoid outdoor activities. Wear a mask if necessary.' };
  };

  const recommendation = getHealthRecommendation(aqi);

  return (
    <Card title="Health Insights">
      <Alert
        message="Health Recommendation"
        description={recommendation.message}
        type={recommendation.type as any}
        showIcon
      />
    </Card>
  );
};
