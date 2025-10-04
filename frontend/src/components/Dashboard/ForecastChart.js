import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAirQuality } from '../../contexts/AirQualityContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, addHours } from 'date-fns';
import './ForecastChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ForecastChart = ({ viewMode }) => {
  const { forecast, selectedTimeRange, setSelectedTimeRange, getAqiColor } = useAirQuality();
  const { isDarkMode } = useTheme();
  const [chartType, setChartType] = useState('line');

  // Generate mock forecast data if not available
  const generateForecastData = () => {
    const hours = selectedTimeRange === '6h' ? 6 : selectedTimeRange === '24h' ? 24 : 72;
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < hours; i++) {
      const time = addHours(now, i);
      const baseAqi = 75 + Math.sin(i * 0.3) * 25 + Math.random() * 20;
      data.push({
        time: time.toISOString(),
        aqi: Math.max(0, Math.min(300, Math.round(baseAqi))),
        temperature: 20 + Math.sin(i * 0.2) * 10,
        humidity: 50 + Math.cos(i * 0.15) * 20
      });
    }
    return data;
  };

  const forecastData = forecast.length > 0 ? forecast : generateForecastData();
  
  const chartData = {
    labels: forecastData.map(item => 
      selectedTimeRange === '6h' 
        ? format(new Date(item.time), 'HH:mm')
        : selectedTimeRange === '24h'
        ? format(new Date(item.time), 'HH:mm')
        : format(new Date(item.time), 'MMM dd')
    ),
    datasets: [
      {
        label: 'AQI Forecast',
        data: forecastData.map(item => item.aqi),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: forecastData.map(item => getAqiColor(item.aqi)),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: viewMode === 'compact' ? 3 : 5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: viewMode !== 'compact',
        labels: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            const item = forecastData[context[0].dataIndex];
            return format(new Date(item.time), 'MMM dd, HH:mm');
          },
          label: function(context) {
            const item = forecastData[context.dataIndex];
            return [
              `AQI: ${item.aqi}`,
              `Temperature: ${item.temperature?.toFixed(1)}°C`,
              `Humidity: ${item.humidity?.toFixed(0)}%`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 200,
        ticks: {
          color: isDarkMode ? '#ffffff' : '#333333',
          callback: function(value) {
            if (value <= 50) return `${value} Good`;
            if (value <= 100) return `${value} Moderate`;
            if (value <= 150) return `${value} Unhealthy*`;
            return `${value} Unhealthy`;
          }
        },
        grid: {
          color: isDarkMode ? '#444444' : '#e0e0e0'
        }
      },
      x: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#333333',
          maxTicksLimit: viewMode === 'compact' ? 6 : 12
        },
        grid: {
          color: isDarkMode ? '#444444' : '#e0e0e0'
        }
      }
    }
  };

  const timeRanges = [
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '72h', label: '3 Days' }
  ];

  return (
    <div className={`forecast-chart ${viewMode}`}>
      <div className="chart-header">
        <h3>AQI Forecast</h3>
        
        {viewMode !== 'compact' && (
          <div className="chart-controls">
            <div className="time-range-selector">
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  className={selectedTimeRange === range.value ? 'active' : ''}
                  onClick={() => setSelectedTimeRange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      {viewMode === 'detailed' && (
        <div className="forecast-summary">
          <div className="summary-item">
            <span className="summary-label">Peak AQI</span>
            <span className="summary-value">
              {Math.max(...forecastData.map(item => item.aqi))}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average AQI</span>
            <span className="summary-value">
              {Math.round(forecastData.reduce((sum, item) => sum + item.aqi, 0) / forecastData.length)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Trend</span>
            <span className="summary-value">
              {forecastData[forecastData.length - 1]?.aqi > forecastData[0]?.aqi ? '📈 Worsening' : '📉 Improving'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;