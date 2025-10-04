import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const apiService = {
  async getCurrentAQI(lat: number, lon: number) {
    return axios.get(`${API_BASE_URL}/api/aqi/current`, { params: { lat, lon }});
  },

  async getForecast(lat: number, lon: number) {
    return axios.get(`${API_BASE_URL}/api/aqi/forecast`, { params: { lat, lon }});
  },

  async subscribeToAlerts(email: string, preferences: any) {
    return axios.post(`${API_BASE_URL}/api/alerts/subscribe`, { email, preferences });
  },

  async getHistoricalData(lat: number, lon: number, startDate: Date, endDate: Date) {
    return axios.get(`${API_BASE_URL}/api/aqi/historical`, {
      params: { lat, lon, startDate, endDate }
    });
  }
};
