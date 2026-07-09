import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://hrapi.femtechaccess.com.ng/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

let cachedToken: string | null = null;

const getToken = (): string | null => {
  if (cachedToken) return cachedToken;
  cachedToken = localStorage.getItem('authToken');
  return cachedToken;
};

const setToken = (token: string | null) => {
  cachedToken = token;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    if (!token && !isPublicEndpoint) {
      console.warn('No authentication token found. Request may fail.', config.url);
    } else if (token && !isPublicEndpoint) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 with auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');
      const isLoginPage = window.location.pathname === '/login';

      if (isLoginRequest || isLoginPage) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.log('No refresh token available, redirecting to login');
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        if (response.data?.success && response.data?.data?.tokens) {
          const newAccessToken = response.data.data.tokens.accessToken;
          const newRefreshToken = response.data.data.tokens.refreshToken;

          setToken(newAccessToken);
          localStorage.setItem('authToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }

        throw new Error('Token refresh failed');
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.data) {
      error.apiError = error.response.data;
    }

    return Promise.reject(error);
  }
);

function clearAuthAndRedirect() {
  setToken(null);
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('permissions');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userId');
  window.location.href = '/login';
}

export { setToken, getToken };
export default apiClient;