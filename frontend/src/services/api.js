import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('tokens'));
    if (tokens && tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variables to handle multiple requests during refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        if (tokens && tokens.refreshToken) {
          const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const { tokens: newTokens } = response.data.data;
          localStorage.setItem('tokens', JSON.stringify(newTokens));

          isRefreshing = false;
          processQueue(null, newTokens.accessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // Refresh failed, logout user
        // Only clear if tokens haven't been updated by another tab already
        const currentTokens = localStorage.getItem('tokens');
        if (!currentTokens || JSON.parse(currentTokens).refreshToken === JSON.parse(localStorage.getItem('tokens'))?.refreshToken) {
           localStorage.removeItem('tokens');
           localStorage.removeItem('user');
           window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
