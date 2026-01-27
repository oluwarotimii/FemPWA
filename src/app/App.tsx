import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { PWAProvider } from '@/app/contexts/PWAContext';
import { Toaster } from '@/app/components/ui/sonner';
import { LoginScreen } from '@/app/components/screens/LoginScreen';
import { DashboardScreen } from '@/app/components/screens/DashboardScreen';
import { AttendanceHistoryScreen } from '@/app/components/screens/AttendanceHistoryScreen';
import { LeaveManagementScreen } from '@/app/components/screens/LeaveManagementScreen';
import { NewLeaveRequestScreen } from '@/app/components/screens/NewLeaveRequestScreen';
import { NotificationsScreen } from '@/app/components/screens/NotificationsScreen';
import { FormsScreen } from '@/app/components/screens/FormsScreen';
import { ProfileScreen } from '@/app/components/screens/ProfileScreen';
import { BottomNavigation } from '@/app/components/BottomNavigation';
import { PWAInstallPrompt } from '@/app/components/PWAInstallPrompt';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <BottomNavigation />
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendanceHistoryScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <LeaveManagementScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-leave"
        element={
          <ProtectedRoute>
            <NewLeaveRequestScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms"
        element={
          <ProtectedRoute>
            <FormsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PWAProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <PWAInstallPrompt />
            <AppRoutes />
            <Toaster position="top-center" richColors />
          </div>
        </AuthProvider>
      </PWAProvider>
    </BrowserRouter>
  );
}
