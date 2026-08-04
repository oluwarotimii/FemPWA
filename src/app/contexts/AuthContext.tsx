import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi, staffApi } from '@/app/services/api';
import { setToken } from '@/app/services/api/apiClient';

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
  login: (email: string, password: string) => Promise<User>;
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

  // Check if user has a specific permission (wildcard '*' grants all)
  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions['*'] === true || permissions[permission] === true;
  };

  // Check if user has any of the specified permissions (wildcard '*' grants all)
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissions) return false;
    if (permissions['*'] === true) return true;
    return permissionList.some((perm) => permissions[perm] === true);
  };

  const updatePermissions = (newPermissions: Permissions) => {
    setPermissions(newPermissions);
    // Also store in localStorage for persistence
    localStorage.setItem('permissions', JSON.stringify(newPermissions));
  };

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) return;

      setToken(token);

      // Check token expiry
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('tokenExpiry');
        setUser(null);
        return;
      }

      // Restore cached user + permissions instantly so the app is usable offline
      const cachedUserData = localStorage.getItem('userData');
      const cachedPerms = localStorage.getItem('permissions');
      let restoredFromCache = false;

      if (cachedUserData) {
        try {
          const parsed = JSON.parse(cachedUserData);
          // Normalize cached shape — login stores the raw API user object
          const cachedUser: User = parsed.id
            ? {
                id: parsed.id,
                email: parsed.email,
                fullName: parsed.fullName,
                roleId: parsed.roleId,
                branchId: parsed.branchId,
                avatar: parsed.profile_picture || parsed.avatar,
                phone: parsed.phone,
                designation: parsed.designation,
                department: parsed.department,
                needs_password_change: parsed.needs_password_change ?? false,
                needs_profile_completion: parsed.needs_profile_completion ?? false,
              }
            : parsed;
          setUser(cachedUser);
          restoredFromCache = true;
        } catch {
          // Ignore corrupt cache
        }
      }

      if (cachedPerms) {
        try { setPermissions(JSON.parse(cachedPerms)); } catch { /* ignore */ }
      }

      // Fetch fresh data from the server in the background.
      // If offline or server unreachable, keep the cached user — don't log them out.
      const [response, permResult] = await Promise.allSettled([
        staffApi.getCurrentUserStaffDetails(),
        authApi.getPermissions(),
      ]);

      if (permResult.status === 'fulfilled') {
        const permResponse = permResult.value;
        if (permResponse.success && permResponse.data?.permissions) {
          setPermissions(permResponse.data.permissions);
          localStorage.setItem('permissions', JSON.stringify(permResponse.data.permissions));
        }
      }

      if (response.status === 'fulfilled' && response.value?.success && response.value.data) {
        const data = response.value.data;
        let userData: User = data.staff || data.user || data;

        if (data.staff) {
          userData = {
            id: data.staff.user_id,
            email: data.staff.email,
            fullName: data.staff.full_name,
            roleId: data.staff.role_id || 0,
            branchId: data.staff.branch_id || 0,
            avatar: data.staff.profile_picture,
            phone: data.staff.phone,
            designation: data.staff.designation,
            department: data.staff.department,
            needs_password_change: !!data.staff.must_change_password,
            needs_profile_completion: !data.staff.phone,
          };
        }

        setUser(userData);
      } else if (response.status === 'rejected' && !restoredFromCache) {
        // Server unreachable AND no cached data → truly can't restore session
        setUser(null);
      }
      // If server call fails but we already restored from cache, keep the user logged in
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Only clear session on explicit auth rejection (401), not network failures
      const status = (error as any)?.response?.status;
      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('tokenExpiry');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await authApi.login({ email, password });

      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'Invalid response from server');
      }

      const userData = response.data.user;
      const token = response.data.tokens?.accessToken || response.data.token;
      const refreshToken = response.data.tokens?.refreshToken || null;
      const userPermissions = response.data.permissions;

      if (!userData || !token) {
        throw new Error('No user data or token received from server');
      }

      // Always persistent login (90 days)
      setToken(token);
      localStorage.setItem('authToken', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('userId', userData.id.toString());
      const expiryTime = Date.now() + (90 * 24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      localStorage.setItem('userData', JSON.stringify(userData));

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
        needs_password_change: userData.needs_password_change ?? false,
        needs_profile_completion: userData.needs_profile_completion ?? false
      };

      setUser(mappedUser);
      return mappedUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Invalid credentials';
      throw new Error(errorMessage);
    }
  };
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setPermissions(null);
      // Clear all storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('permissions');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userId');
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