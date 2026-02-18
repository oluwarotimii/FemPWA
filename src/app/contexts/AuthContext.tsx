import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi, staffApi } from '@/app/services/api'; // Ensure staffApi is imported

interface User {
  id: number;
  email: string;
  fullName: string;
  roleId: number;
  branchId: number;
  avatar?: string;
  phone?: string;
  designation?: string;
  department?: string;
  needs_password_change?: boolean;
  needs_profile_completion?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>; // Return user data
  logout: () => void;
  updateUser: (user: User) => void;
  needsPasswordChange: boolean;
  needsProfileCompletion: boolean;
  initializeAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const needsPasswordChange = user?.needs_password_change || false;
  const needsProfileCompletion = user?.needs_profile_completion || false;

  // FIXED: Actually fetches user data so state isn't 'null' on refresh
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      if (token) {
        // Standard Way: Fetch fresh user data from the server using the stored token
        // This ensures the token is still valid and the user profile is up to date
        const response = await staffApi.getCurrentUserStaffDetails();

        if (response && response.success && response.data) {
          // Adjust this based on your API structure (e.g., response.data.staff)
          let userData = response.data.staff || response.data.user || response.data;

          // Ensure the userData matches the User interface structure
          if (response.data.staff) {
            // If the API returns staff data, map it to the User interface
            userData = {
              id: response.data.staff.user_id,
              email: response.data.staff.email,
              fullName: response.data.staff.full_name,
              roleId: response.data.staff.role_id || 0,
              branchId: response.data.staff.branch_id || 0,
              avatar: response.data.staff.profile_picture,
              phone: response.data.staff.phone,
              designation: response.data.staff.designation,
              department: response.data.staff.department,
              needs_password_change: response.data.staff.needs_password_change,
              needs_profile_completion: response.data.staff.needs_profile_completion
            };
          }

          setUser(userData);
          console.log('Auth initialized: User restored');
        } else {
          console.log('No user data returned from server');
        }
      } else {
        console.log('No token found, user is not authenticated');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // If the token is expired/invalid, clear everything
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean): Promise<User> => {
    try {
      console.log('Starting login process...');
      const response = await authApi.login({ email, password });
      console.log('Login API response:', response);
      console.log('Response type:', typeof response);

      if (!response) {
        console.log('Response is falsy');
        throw new Error('No response received from server');
      }

      console.log('Checking response.success...');
      console.log('response.success value:', response.success);
      if (!response.success) {
        console.log('Success is falsy, message:', response.message);
        throw new Error(response.message || 'Login failed');
      }

      console.log('Checking response.data existence...');
      if (!response.data) {
        console.log('Response.data is falsy:', response.data);
        throw new Error('No data in response');
      }

      console.log('Extracting user and token data...');
      const userData = response.data.user;
      const token = response.data.tokens?.accessToken || response.data.token;

      if (!userData) {
        console.log('User data is falsy:', userData);
        throw new Error('No user data in response');
      }

      if (!token) {
        console.log('Token is falsy:', token);
        throw new Error('No token received from server');
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userData.id.toString());

      setUser(userData);
      console.log('Login successful! Token stored.');

      // Check if user needs to change password after login
      if (userData.needs_password_change) {
        console.log('User needs to change password');
      }

      return userData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Invalid credentials');
    }
  };
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateUser,
      needsPasswordChange,
      needsProfileCompletion,
      initializeAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};