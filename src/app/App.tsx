import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { PWAProvider } from '@/app/contexts/PWAContext';
import { Toaster } from '@/app/components/ui/sonner';
import { LoginScreen } from '@/app/components/screens/LoginScreen';
import { DashboardScreen } from '@/app/components/screens/DashboardScreen';
import { AttendanceHistoryScreen } from '@/app/components/screens/AttendanceHistoryScreen';
import { LeaveManagementScreen } from '@/app/components/screens/LeaveManagementScreen';
import { LeaveHistoryScreen } from '@/app/components/screens/LeaveHistoryScreen';
import { NewLeaveRequestScreen } from '@/app/components/screens/NewLeaveRequestScreen';
import { ShiftsManagementScreen } from '@/app/components/screens/ShiftsManagementScreen';
import { NotificationsScreen } from '@/app/components/screens/NotificationsScreen';
import { FormsScreen } from '@/app/components/screens/FormsScreen';
import { ProfileScreen } from '@/app/components/screens/ProfileScreen';
import { ChangePasswordScreen } from '@/app/components/screens/ChangePasswordScreen';
import { FillPersonalDetailsScreen } from '@/app/components/screens/FillPersonalDetailsScreen';
import { StaffDetailsFormScreen } from '@/app/components/screens/StaffDetailsFormScreen';
import { HolidaysScreen } from '@/app/components/screens/HolidaysScreen';
import { BottomNavigation } from '@/app/components/BottomNavigation';
import { PWAInstallPrompt } from '@/app/components/PWAInstallPrompt';
import { DevTools } from '@/app/components/DevTools';
import { GuarantorPage } from '@/app/pages/GuarantorPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password change if required - TEMPORARILY DISABLED
  // if (user?.needs_password_change && location.pathname !== '/change-password') {
  //   return <Navigate to="/change-password" replace />;
  // }

  // Don't render children until user is loaded
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // BottomNavigation should show for all authenticated users
  // The condition !user?.needs_password_change ensures it doesn't show on password change screen
  return (
    <>
      {children}
      <BottomNavigation key={user?.id || 'bottom-nav'} />
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />
        }
      />
      {/* <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordScreen />
          </ProtectedRoute>
        }
      /> */}
      {/* Change password route temporarily disabled */}
      <Route
        path="/fill-personal-details"
        element={
          <FillPersonalDetailsScreen />
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
        path="/leave-history"
        element={
          <ProtectedRoute>
            <LeaveHistoryScreen />
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
        path="/shifts"
        element={
          <ProtectedRoute>
            <ShiftsManagementScreen />
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
      <Route
        path="/staff-details-form"
        element={
          <ProtectedRoute>
            <StaffDetailsFormScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/holidays"
        element={
          <ProtectedRoute>
            <HolidaysScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guarantors"
        element={
          <ProtectedRoute>
            <GuarantorPage />
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
            <DevTools />
          </div>
        </AuthProvider>
      </PWAProvider>
    </BrowserRouter>
  );
}
