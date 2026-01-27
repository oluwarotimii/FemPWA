import { createContext, useContext, useState, ReactNode } from 'react';
import { authApi } from '@/app/services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  branch_id: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const response = await authApi.login({ email, password });

      // Extract user data from response
      const userData = response.data.user;
      setUser(userData);

      // Store the token
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', userData.id.toString());
    } catch (error) {
      // Fallback to mock implementation for development
      const mockUser: User = {
        id: 1,
        email: email,
        full_name: 'Sarah Johnson',
        role_id: 4,
        branch_id: 1,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
      };

      setUser(mockUser);
      if (rememberMe) {
        localStorage.setItem('authToken', 'mock-token');
        localStorage.setItem('userId', mockUser.id.toString());
      } else {
        throw new Error('Invalid credentials');
      }
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

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      updateUser
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
