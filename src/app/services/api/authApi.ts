import axios from 'axios';
import apiClient from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  fullName: string;
  roleId: number;
  branchId: number;
  needs_password_change?: boolean;
  needs_profile_completion?: boolean;
}

interface Permissions {
  [key: string]: boolean;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: Tokens;
    permissions: Permissions;
  };
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword?: string;
}

// Retry a login attempt up to maxAttempts times on network/timeout errors only.
// Never retries on auth errors (401/403) — wrong password should fail immediately.
async function loginWithRetry(
  credentials: LoginCredentials,
  maxAttempts = 3,
  delayMs = 2000,
): Promise<LoginResponse> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post(
        `${apiClient.defaults.baseURL}/auth/login`,
        credentials,
        {
          timeout: 60000, // 60 s — enough for a cold-starting Render server to wake up
          headers: { 'Content-Type': 'application/json' },
        },
      );
      return response.data as LoginResponse;
    } catch (err: any) {
      lastError = err;

      // Don't retry on auth errors — the credentials are wrong
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 400) {
        throw err;
      }

      // Only retry on network/timeout errors
      const isRetryable =
        !err.response ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('timeout') ||
        err.message === 'Network Error';

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      // Exponential back-off: 2 s, 4 s
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

export const authApi = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    loginWithRetry(credentials),

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue with local cleanup even if the server call fails
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userId');
    }
  },

  getPermissions: async (): Promise<{ success: boolean; data: { permissions: Permissions } }> => {
    const response = await apiClient.get('/auth/permissions');
    return response.data;
  },

  changePassword: async (request: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/password-change/change', request);
    return response.data;
  },
};
