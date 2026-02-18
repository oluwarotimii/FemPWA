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
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log('Auth API - Making login request:', credentials);
    const response = await apiClient.post('/auth/login', credentials);
    console.log('Auth API - Login response:', response.data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      // Call the logout endpoint if available
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always remove local authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
    }
  },

  changePassword: async (request: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.put(`/users/${userId}/password-change`, request);
    return response.data;
  },
};