import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { PWAProvider, usePWA } from '@/app/contexts/PWAContext';
import { Toaster } from '@/app/components/ui/sonner';
import { BottomNavigation } from '@/app/components/BottomNavigation';
import { PWAInstallPrompt } from '@/app/components/PWAInstallPrompt';
import { PullToRefresh } from '@/app/components/PullToRefresh';
import { DevTools } from '@/app/components/DevTools';

// Eagerly loaded — shown during auth loading / on the login path
import { LoginScreen } from '@/app/components/screens/LoginScreen';
import { ForgotPasswordScreen } from '@/app/components/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/app/components/screens/ResetPasswordScreen';

// Lazily loaded — not needed until user navigates there
const DashboardScreen = lazy(() => import('@/app/components/screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const AttendanceHistoryScreen = lazy(() => import('@/app/components/screens/AttendanceHistoryScreen').then(m => ({ default: m.AttendanceHistoryScreen })));
const LeaveManagementScreen = lazy(() => import('@/app/components/screens/LeaveManagementScreen').then(m => ({ default: m.LeaveManagementScreen })));
const LeaveRequestManagementScreen = lazy(() => import('@/app/components/screens/LeaveRequestManagementScreen').then(m => ({ default: m.LeaveRequestManagementScreen })));
const LeaveHistoryScreen = lazy(() => import('@/app/components/screens/LeaveHistoryScreen').then(m => ({ default: m.LeaveHistoryScreen })));
const NewLeaveRequestScreen = lazy(() => import('@/app/components/screens/NewLeaveRequestScreen').then(m => ({ default: m.NewLeaveRequestScreen })));
const ShiftsManagementScreen = lazy(() => import('@/app/components/screens/ShiftsManagementScreen').then(m => ({ default: m.ShiftsManagementScreen })));
const ShiftExceptionManagementScreen = lazy(() => import('@/app/components/screens/ShiftExceptionManagementScreen').then(m => ({ default: m.ShiftExceptionManagementScreen })));
const NotificationsScreen = lazy(() => import('@/app/components/screens/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })));
const FormsScreen = lazy(() => import('@/app/components/screens/FormsScreen').then(m => ({ default: m.FormsScreen })));
const ProfileScreen = lazy(() => import('@/app/components/screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ChangePasswordScreen = lazy(() => import('./components/screens/ChangePasswordScreen').then(m => ({ default: m.ChangePasswordScreen })));
const FillPersonalDetailsScreen = lazy(() => import('@/app/components/screens/FillPersonalDetailsScreen').then(m => ({ default: m.FillPersonalDetailsScreen })));
const StaffDetailsFormScreen = lazy(() => import('@/app/components/screens/StaffDetailsFormScreen').then(m => ({ default: m.StaffDetailsFormScreen })));
const HolidaysScreen = lazy(() => import('@/app/components/screens/HolidaysScreen').then(m => ({ default: m.HolidaysScreen })));
const FloatingDayScreen = lazy(() => import('@/app/components/screens/FloatingDayScreen').then(m => ({ default: m.FloatingDayScreen })));
const GuarantorPage = lazy(() => import('@/app/pages/GuarantorPage').then(m => ({ default: m.GuarantorPage })));
const NotFoundScreen = lazy(() => import('@/app/components/screens/NotFoundScreen').then(m => ({ default: m.NotFoundScreen })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A2B3C]" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isInstalled } = usePWA();
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

  // Force password change if required
  if (user?.needs_password_change && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

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
      <PullToRefresh isStandalone={isInstalled}>
        <div className="min-h-screen pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </PullToRefresh>
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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordScreen />
          </ProtectedRoute>
        }
      />
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
        path="/manage-leave-requests"
        element={
          <ProtectedRoute>
            <LeaveRequestManagementScreen />
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
        path="/shift-exceptions"
        element={
          <ProtectedRoute>
            <ShiftExceptionManagementScreen />
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
        path="/floating-days"
        element={
          <ProtectedRoute>
            <FloatingDayScreen />
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
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
    </Suspense>
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
