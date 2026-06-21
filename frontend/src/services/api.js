import axios from 'axios';
import showToast from '../utils/toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Intercept unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized or token expired, clear tokens and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch a custom logout event to notify context without page reload
      window.dispatchEvent(new CustomEvent('auth-logout'));
      
      // If we are not already on the login page, redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else {
      // Trigger error toast globally
      showToast.error(error);
    }
    return Promise.reject(error);
  }
);

export default api;
