import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and validate it
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    // Check if token exists before making the request
    if (!token) {
      console.warn('No authentication token found. Request may fail.', config.url);
      // Optionally, we could redirect to login here
      // window.location.href = '/login';
    } else {
      console.log('API Client - Using token for request:', config.url); // Debug log
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('API Client - Error response:', error.response); // Debug log

    if (error.response?.status === 401) {
      // Token might be expired or invalid, redirect to login
      console.log('Unauthorized request - clearing token and redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }

    // Format error response according to API documentation
    if (error.response?.data) {
      // The API follows a consistent error response format
      // { success: false, message: "Error description", error: {...} }
      error.apiError = error.response.data;
    }

    // Return the error to be handled by the calling function
    return Promise.reject(error);
  }
);

export default apiClient;