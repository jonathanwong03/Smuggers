import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../contexts/ThemeContext';
import './PollutantChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PollutantChart = ({ pollutants, viewMode }) => {
  const { isDarkMode } = useTheme();
  
  if (!pollutants || pollutants.length === 0) {
    return (
      <div className="pollutant-chart">
        <h3>Pollutant Levels</h3>
        <p>No pollutant data available</p>
      </div>
    );
  }

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  const chartData = {
    labels: pollutants.map(p => p.name),
    datasets: [{
      label: 'Concentration (μg/m³)',
      data: pollutants.map(p => p.value),
      backgroundColor: colors.slice(0, pollutants.length),
      borderColor: colors.slice(0, pollutants.length),
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: viewMode === 'compact' ? 'bottom' : 'top',
        labels: {
          color: isDarkMode ? '#ffffff' : '#333333',
          font: {
            size: viewMode === 'compact' ? 10 : 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const pollutant = pollutants[context.dataIndex];
            return `${pollutant.name}: ${pollutant.value.toFixed(2)} μg/m³`;
          }
        }
      }
    },
    scales: viewMode !== 'compact' ? {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        grid: {
          color: isDarkMode ? '#444444' : '#e0e0e0'
        }
      },
      x: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        grid: {
          color: isDarkMode ? '#444444' : '#e0e0e0'
        }
      }
    } : undefined
  };

  const getPollutantStatus = (name, value) => {
    const thresholds = {
      'PM2.5': { good: 12, moderate: 35, unhealthy: 55 },
      'PM10': { good: 54, moderate: 154, unhealthy: 254 },
      'NO2': { good: 53, moderate: 100, unhealthy: 360 },
      'O3': { good: 54, moderate: 70, unhealthy: 85 },
      'CO': { good: 4.4, moderate: 9.4, unhealthy: 12.4 }
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.moderate) return 'moderate';
    if (value <= threshold.unhealthy) return 'unhealthy';
    return 'very-unhealthy';
  };

  return (
    <div className={`pollutant-chart ${viewMode}`}>
      <div className="chart-header">
        <h3>Pollutant Levels</h3>
        {viewMode === 'detailed' && (
          <div className="chart-controls">
            <button className="chart-type-btn active">Bar</button>
            <button className="chart-type-btn">Pie</button>
          </div>
        )}
      </div>

      <div className="chart-container">
        {viewMode === 'compact' ? (
          <Doughnut data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {viewMode !== 'compact' && (
        <div className="pollutant-list">
          {pollutants.map((pollutant, index) => (
            <div key={pollutant.name} className="pollutant-item">
              <div className="pollutant-info">
                <span 
                  className="pollutant-dot" 
                  style={{ backgroundColor: colors[index] }}
                ></span>
                <span className="pollutant-name">{pollutant.name}</span>
                <span className="pollutant-value">
                  {pollutant.value.toFixed(2)} μg/m³
                </span>
              </div>
              <div className={`pollutant-status ${getPollutantStatus(pollutant.name, pollutant.value)}`}>
                {getPollutantStatus(pollutant.name, pollutant.value).replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollutantChart;