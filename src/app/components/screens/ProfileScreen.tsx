import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Edit, User, Briefcase, MapPin, Calendar, Moon, Sun, Bell, Lock, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

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
                src={user?.avatar}
                alt={user?.name}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white text-[#1A2B3C] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
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
              <div className="font-medium text-gray-900">{user?.employeeId}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Department</div>
              <div className="font-medium text-gray-900">{user?.department}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Branch</div>
              <div className="font-medium text-gray-900">{user?.branch}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Join Date</div>
              <div className="font-medium text-gray-900">
                {new Date(user?.joinDate || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
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
            <Button variant="ghost" size="sm" className="text-blue-600">
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
