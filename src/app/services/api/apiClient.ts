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

// Refresh tokens are rotated server-side (the old one is revoked the instant
// a new one is issued), so two browser tabs racing to refresh the same
// stored refresh token is a real scenario — people commonly leave the PWA
// open in multiple tabs. Without cross-tab coordination, the loser tab gets
// TOKEN_REVOKED and force-logs-out everyone, even though the session is
// actually fine (another tab just renewed it). The Web Locks API serializes
// the actual network refresh across every tab of the same origin; a tab that
// loses the race just re-reads localStorage instead of nuking the session.
async function refreshTokensCoordinated(staleAccessToken: string | null): Promise<string> {
  const doRefresh = async (): Promise<string> => {
    // Another tab may have already refreshed while we were waiting for the
    // lock (or for our turn in the queue) — if the stored token has already
    // moved on from the one that just 401'd, use it instead of refreshing again.
    const currentToken = localStorage.getItem('authToken');
    if (currentToken && currentToken !== staleAccessToken) {
      setToken(currentToken);
      return currentToken;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw Object.assign(new Error('No refresh token'), { response: { status: 401 } });
    }

    const response = await axios.post(
      `${apiClient.defaults.baseURL}/auth/refresh`,
      { refreshToken },
      { timeout: 15000 }
    );

    if (response.data?.success && response.data?.data?.tokens) {
      const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data.tokens;
      setToken(newAccess);
      localStorage.setItem('authToken', newAccess);
      if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
      return newAccess;
    }
    throw new Error('Token refresh failed');
  };

  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('femtech-token-refresh', doRefresh);
  }
  return doRefresh();
}

// Response interceptor — handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      const isLoginOrRefresh =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/refresh');
      const isLoginPage = window.location.pathname === '/login';

      if (isLoginOrRefresh || isLoginPage) {
        return Promise.reject(error);
      }

      // A request that was already retried once with a fresh token and still
      // got a 401 means the session is genuinely dead (or was revoked mid-flight).
      // Retrying again would risk a silent loop, so force a clean logout instead
      // of leaving the user stuck on a broken screen with a raw error message.
      if (originalRequest._retry) {
        clearAuthAndRedirect();
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
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const staleAccessToken = getToken();

      try {
        const newAccess = await refreshTokensCoordinated(staleAccessToken);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        // Before giving up, check one more time whether a sibling tab
        // (holding the lock ahead of us, or racing independently) already
        // landed a fresh token — only a genuinely stale/dead session should
        // sign the user out. A network blip or timeout while refreshing must
        // NOT nuke the session either — that was forcing people to log back
        // in far more often than their token had actually expired.
        const latestToken = localStorage.getItem('authToken');
        if (latestToken && latestToken !== staleAccessToken) {
          setToken(latestToken);
          originalRequest.headers.Authorization = `Bearer ${latestToken}`;
          return apiClient(originalRequest);
        }
        if (refreshError?.response) {
          clearAuthAndRedirect();
        }
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
