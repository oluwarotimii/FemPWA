import apiClient from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  branch_id: number;
}

interface Permissions {
  [key: string]: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
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
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // In a real implementation, you might want to call a logout endpoint
    // For now, we just remove the token locally
    localStorage.removeItem('authToken');
  },

  changePassword: async (request: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/users/${localStorage.getItem('userId')}/password-change`, request);
    return response.data;
  },
};