import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Edit, User, Briefcase, MapPin, Calendar, Moon, Sun, Bell, Lock, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { staffApi } from '@/app/services/api';

interface StaffDetails {
  id: number;
  user_id: number;
  employee_id: string;
  designation: string;
  department: string;
  branch_id: number;
  joining_date: string;
  employment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        console.log('Fetching staff details...'); // Debug log
        console.log('Current token:', localStorage.getItem('authToken')); // Debug log

        // Check if user is authenticated before making the API call
        if (!user) {
          console.log('No user found, skipping API call');
          return;
        }

        const response = await staffApi.getCurrentUserStaffDetails();
        console.log('Staff details response:', response); // Debug log

        // Handle different response structures
        if (response.data && response.data.staff) {
          // If response has staff object inside data
          setStaffDetails(response.data.staff);
        } else if (response.data && response.data.user) {
          // If response has user object inside data (might need mapping)
          // Map user data to staff details structure
          const mappedStaffDetails = {
            id: response.data.user.id,
            user_id: response.data.user.id,
            employee_id: response.data.user.employee_id || 'N/A',
            designation: response.data.user.designation || response.data.user.job_title || 'N/A',
            department: response.data.user.department || 'N/A',
            branch_id: response.data.user.branchId || response.data.user.branch_id || 0,
            joining_date: response.data.user.joining_date || response.data.user.created_at || 'N/A',
            employment_type: response.data.user.employment_type || 'Full-time',
            status: response.data.user.status || 'Active',
            created_at: response.data.user.created_at || new Date().toISOString(),
            updated_at: response.data.user.updated_at || new Date().toISOString()
          };
          setStaffDetails(mappedStaffDetails);
        } else if (response.data) {
          // If response.data is the staff details object directly
          setStaffDetails(response.data);
        } else {
          console.error('Unexpected response structure:', response);
          throw new Error('Invalid response structure from server');
        }
      } catch (error: any) {
        console.error('Failed to fetch staff details:', error);
        console.error('Error response:', error.response); // Debug log

        // Check if it's a permissions error (403), authentication error (401), or other error
        if (error.response?.status === 403) {
          toast.error('Access denied', {
            description: 'You do not have permission to view profile details. Contact your administrator.'
          });
        } else if (error.response?.status === 401) {
          toast.error('Session expired', {
            description: 'Please log in again to continue.'
          });
        } else if (error.response?.status === 400) {
          toast.error('Bad request', {
            description: error.response?.data?.message || 'Invalid request to fetch profile details'
          });
        } else {
          toast.error('Unable to load profile information', {
            description: error.response?.data?.message || 'Please try again later'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStaffDetails();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    toast.info(checked ? 'Dark mode enabled' : 'Dark mode disabled');
  };

  const handleToggleNotifications = (checked: boolean) => {
    setPushNotifications(checked);
    toast.info(
      checked ? 'Push notifications enabled' : 'Push notifications disabled'
    );
  };

  if (loading) {
    return (
      <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12 text-gray-500">Loading profile information...</div>
      </div>
    );
  }

  // Helper function to capitalize and format status values
  const formatStatus = (status: string | undefined) => {
    if (!status) return 'N/A';

    // Split by underscores and capitalize each word
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card className="shadow-lg bg-gradient-to-br from-[#1A2B3C] to-[#2C3E50] text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={user?.fullName}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white text-[#1A2B3C] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{user?.fullName}</h2>
              <p className="text-white/70 text-sm">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">
            Employee Information
          </h3>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Employee ID</div>
              <div className="font-medium text-gray-900">{staffDetails?.employee_id}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Department</div>
              <div className="font-medium text-gray-900">{staffDetails?.department}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Designation</div>
              <div className="font-medium text-gray-900">{staffDetails?.designation}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Branch ID</div>
              <div className="font-medium text-gray-900">{staffDetails?.branch_id}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Join Date</div>
              <div className="font-medium text-gray-900">
                {staffDetails?.joining_date ? new Date(staffDetails.joining_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Employment Type</div>
              <div className="font-medium text-gray-900">{formatStatus(staffDetails?.employment_type)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-medium text-gray-900">{formatStatus(staffDetails?.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-1">
          <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Change Password
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600"
              onClick={() => navigate('/change-password')}
            >
              Update
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Push Notifications
              </span>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-900">
                Dark Mode
              </span>
            </div>
            <Switch checked={darkMode} onCheckedChange={handleToggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full h-12 bg-red-600 hover:bg-red-700"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </Button>
    </div>
  );
}
