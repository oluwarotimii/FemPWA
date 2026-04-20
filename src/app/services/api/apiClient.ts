import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://hrapi.femtechaccess.com.ng/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and validate it
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    // Skip token check for public endpoints (login, register, etc.)
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    if (!token && !isPublicEndpoint) {
      console.warn('No authentication token found. Request may fail.', config.url);
    } else if (token && !isPublicEndpoint) {
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
      // BUT: Don't redirect if we are already on the login page or trying to login
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isLoginPage = window.location.pathname === '/login';

      if (!isLoginRequest && !isLoginPage) {
        console.log('Unauthorized request - clearing token and redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('permissions');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userId');
        window.location.href = '/login';
      }
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