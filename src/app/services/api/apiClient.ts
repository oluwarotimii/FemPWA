import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://hrapi.femtechaccess.com.ng/api',
  timeout: 45000,
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
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some(ep => config.url?.includes(ep));
    if (token && !isPublicEndpoint && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginOrRefresh =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/refresh');
      const isLoginPage = window.location.pathname === '/login';

      if (isLoginOrRefresh || isLoginPage) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
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
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data.tokens;
          setToken(newAccess);
          localStorage.setItem('authToken', newAccess);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          processQueue(null, newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
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

/** Classify an axios error into a human-readable message */
export function getNetworkErrorMessage(error: any): string {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'The server is taking too long to respond. Please try again in a moment.';
  }
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  return error.response?.data?.message || error.message || 'An unexpected error occurred.';
}

export { setToken, getToken };
export default apiClient;
