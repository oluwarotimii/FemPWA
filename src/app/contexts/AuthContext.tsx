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
  profile_picture?: string;
}

interface Permissions {
  [key: string]: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: Permissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>; // Return user data
  logout: () => void;
  updateUser: (user: User) => void;
  updatePermissions: (permissions: Permissions) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  needsPasswordChange: boolean;
  needsProfileCompletion: boolean;
  initializeAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const needsPasswordChange = user?.needs_password_change || false;
  const needsProfileCompletion = user?.needs_profile_completion || false;

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissions) return false;
    return permissionList.some((perm) => permissions[perm] === true);
  };

  const updatePermissions = (newPermissions: Permissions) => {
    setPermissions(newPermissions);
    // Also store in localStorage for persistence
    localStorage.setItem('permissions', JSON.stringify(newPermissions));
  };

  // FIXED: Actually fetches user data so state isn't 'null' on refresh
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      // Check for token in localStorage (persistent) or sessionStorage (temporary)
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      if (token) {
        // Check if token has expired (for persistent logins)
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry);
          if (Date.now() > expiryTime) {
            // Token has expired
            console.log('Token has expired, logging out');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('tokenExpiry');
            setUser(null);
            setIsLoading(false);
            return;
          }
        }

        // Load permissions from localStorage
        const storedPermissions = localStorage.getItem('permissions');
        if (storedPermissions) {
          try {
            const parsed = JSON.parse(storedPermissions);
            setPermissions(parsed);
          } catch (e) {
            console.error('Failed to parse stored permissions:', e);
          }
        }

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
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('tokenExpiry');
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

      if (!response || !response.success || !response.data) {
        throw new Error('No response received from server');
      }

      console.log('Extracting user and token data...');
      const userData = response.data.user;
      const token = response.data.tokens?.accessToken || response.data.token;
      const userPermissions = response.data.permissions;

      if (!userData || !token) {
        throw new Error('No user data or token received from server');
      }

      // Store token with persistence based on rememberMe choice
      if (rememberMe) {
        // Persistent login (3 months)
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userData.id.toString());
        localStorage.setItem('rememberMe', 'true');
        // Set token expiry to 30 days (access token expires before refresh token)
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiry', expiryTime.toString());
        console.log('Persistent login enabled - expires in 30 days');
      } else {
        // Session-only login (expires when browser closes)
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userId', userData.id.toString());
        console.log('Session login enabled');
      }
      
      // Always store user data in localStorage for quick access
      if (userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
      }

      // Store permissions if provided
      if (userPermissions) {
        setPermissions(userPermissions);
        localStorage.setItem('permissions', JSON.stringify(userPermissions));
      }

      // Map the response to our User interface
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        roleId: userData.roleId,
        branchId: userData.branchId,
        avatar: userData.profile_picture || userData.avatar,
        phone: userData.phone,
        designation: userData.designation,
        department: userData.department,
        needs_password_change: userData.needs_password_change,
        needs_profile_completion: userData.needs_profile_completion
      };

      // Set user state and force a small delay to ensure state propagates
      setUser(mappedUser);
      console.log('Login successful! User state set.');
      
      // Small delay to ensure React state propagates before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      return mappedUser;
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
      setPermissions(null);
      // Clear all storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('permissions');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userId');
    }
  };

  // Auto-refresh token before it expires (for persistent logins)
  useEffect(() => {
    const refreshInterval = 24 * 60 * 60 * 1000; // Check every 24 hours
    const refreshTimer = setInterval(async () => {
      const rememberMe = localStorage.getItem('rememberMe');
      if (rememberMe === 'true') {
        try {
          console.log('Auto-refreshing token for persistent login...');
          // The backend will automatically refresh via the refresh token cookie
          await initializeAuth();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, refreshInterval);

    return () => clearInterval(refreshTimer);
  }, []);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateUser,
      updatePermissions,
      hasPermission,
      hasAnyPermission,
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