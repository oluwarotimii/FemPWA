import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Edit, User, Briefcase, MapPin, Calendar, Moon, Sun, Bell, Lock, LogOut, Mail, Phone, Home, Banknote, GraduationCap, AlertCircle, FileCheck, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import apiClient from '@/app/services/api/apiClient';
import { branchesApi, type Branch } from '@/app/services/api';

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
  work_mode: string;
  work_email: string;
  personal_email: string;
  phone_number: string;
  alternate_phone_number: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  current_address_id: string;
  permanent_address_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  tax_identification_number: string;
  highest_qualification: string;
  university_school: string;
  year_of_graduation: string;
  primary_skills: string;
  professional_certifications: string;
  languages_known: string;
  experience_years: string;
  previous_company: string;
  notice_period_days: number;
  weekly_working_hours: string;
  overtime_eligibility: number;
  allergies: string;
  special_medical_notes: string;
  reference_check_status: string;
  background_verification_status: string;
  full_name: string;
  email: string;
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const response = await apiClient.get('/staff/me');

        if (response.data?.success && response.data?.data?.staff) {
          setStaffDetails(response.data.data.staff);
          
          // Fetch branch details if branch_id exists
          if (response.data.data.staff.branch_id) {
            fetchBranchDetails(response.data.data.staff.branch_id);
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch staff details:', error);

        if (error.response?.status === 403) {
          toast.error('Access denied', {
            description: 'You do not have permission to view profile details.'
          });
        } else if (error.response?.status === 401) {
          toast.error('Session expired', {
            description: 'Please log in again to continue.'
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

  const fetchBranchDetails = async (branchId: number) => {
    try {
      const response = await branchesApi.getBranchById(branchId);
      if (response.success && response.data?.branch) {
        setBranch(response.data.branch);
      }
    } catch (error) {
      console.error('Failed to fetch branch details:', error);
    }
  };

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatStatus = (status: string | null) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="p-4 pb-20 max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12 text-gray-500">Loading profile information...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto space-y-6">
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
              <button 
                className="absolute bottom-0 right-0 w-8 h-8 bg-white text-[#1A2B3C] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                onClick={() => navigate('/staff-details-form')}
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{staffDetails?.full_name || user?.fullName}</h2>
              <p className="text-white/70 text-sm">{staffDetails?.email || user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-white/20 hover:bg-white/30">
                  {staffDetails?.employment_type}
                </Badge>
                <Badge className="bg-green-500/80 hover:bg-green-500/90">
                  {staffDetails?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <div className="text-xs text-gray-500">Department</div>
            <div className="font-semibold text-gray-900 text-sm">{staffDetails?.department || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <div className="text-xs text-gray-500">Work Mode</div>
            <div className="font-semibold text-gray-900">{staffDetails?.work_mode || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto text-orange-600 mb-2" />
            <div className="text-xs text-gray-500">Joining Date</div>
            <div className="font-semibold text-gray-900 text-xs">{formatDate(staffDetails?.joining_date)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <Building2 className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <div className="text-xs text-gray-500">Branch</div>
            <div className="font-semibold text-gray-900 text-sm">
              {branch?.name || 'Loading...'}
            </div>
            {branch?.city && (
              <div className="text-xs text-gray-500 mt-1">{branch.city}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Date of Birth" value={formatDate(staffDetails?.date_of_birth)} />
            <InfoRow label="Gender" value={formatStatus(staffDetails?.gender)} />
            <InfoRow label="Marital Status" value={formatStatus(staffDetails?.marital_status)} />
            <InfoRow label="Blood Group" value={staffDetails?.blood_group || 'N/A'} />
            <InfoRow label="Phone Number" value={staffDetails?.phone_number || 'N/A'} icon={<Phone className="w-4 h-4" />} />
            <InfoRow label="Alternate Phone" value={staffDetails?.alternate_phone_number || 'N/A'} icon={<Phone className="w-4 h-4" />} />
            <InfoRow label="Personal Email" value={staffDetails?.personal_email || 'N/A'} icon={<Mail className="w-4 h-4" />} />
            <InfoRow label="Work Email" value={staffDetails?.work_email || 'N/A'} icon={<Mail className="w-4 h-4" />} />
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            Employment Information
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Designation" value={staffDetails?.designation || 'N/A'} />
            <InfoRow label="Department" value={staffDetails?.department || 'N/A'} />
            <InfoRow label="Employment Type" value={formatStatus(staffDetails?.employment_type)} />
            <InfoRow label="Work Mode" value={formatStatus(staffDetails?.work_mode)} />
            <InfoRow label="Weekly Hours" value={staffDetails?.weekly_working_hours || 'N/A'} />
            <InfoRow label="Notice Period" value={staffDetails?.notice_period_days ? `${staffDetails.notice_period_days} days` : 'N/A'} />
            <InfoRow label="Experience" value={staffDetails?.experience_years ? `${staffDetails.experience_years} years` : 'N/A'} />
            <InfoRow label="Previous Company" value={staffDetails?.previous_company || 'N/A'} />
          </div>
        </CardContent>
      </Card>

      {/* Branch Information */}
      {branch && (
        <Card className="shadow-md">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Branch Information
            </h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Branch Name" value={branch.name} />
              <InfoRow label="Branch Code" value={branch.code} />
              <InfoRow label="City" value={branch.city} />
              <InfoRow label="State" value={branch.state} />
              <InfoRow label="Phone" value={branch.phone} icon={<Phone className="w-4 h-4" />} />
              <InfoRow label="Email" value={branch.email} icon={<Mail className="w-4 h-4" />} />
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Address</div>
                <div className="text-sm text-gray-900">{branch.address}, {branch.city}, {branch.state} - {branch.pincode}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address Information */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            Address Information
          </h3>
          <Separator />
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Current Address</div>
              <div className="text-sm text-gray-900">{staffDetails?.current_address_id || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Permanent Address</div>
              <div className="text-sm text-gray-900">{staffDetails?.permanent_address_id || 'Not provided'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Emergency Contact
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoRow label="Contact Name" value={staffDetails?.emergency_contact_name || 'N/A'} />
            <InfoRow label="Contact Phone" value={staffDetails?.emergency_contact_phone || 'N/A'} icon={<Phone className="w-4 h-4" />} />
            <InfoRow label="Relationship" value={formatStatus(staffDetails?.emergency_contact_relationship)} />
          </div>
        </CardContent>
      </Card>

      {/* Bank & Tax Information */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-green-600" />
            Bank Information
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Bank Name" value={staffDetails?.bank_name || 'N/A'} />
            <InfoRow label="Account Number" value={staffDetails?.bank_account_number ? '****' + staffDetails.bank_account_number.slice(-4) : 'N/A'} />
            <InfoRow label="IFSC Code" value={staffDetails?.bank_ifsc_code || 'N/A'} />
          </div>
        </CardContent>
      </Card>

      {/* Education & Skills */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Education & Skills
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Highest Qualification" value={formatStatus(staffDetails?.highest_qualification)} />
            <InfoRow label="University / School" value={staffDetails?.university_school || 'N/A'} />
            <InfoRow label="Year of Graduation" value={staffDetails?.year_of_graduation || 'N/A'} />
            <InfoRow label="Languages Known" value={staffDetails?.languages_known || 'N/A'} />
            <div className="md:col-span-2">
              <div className="text-xs text-gray-500 mb-1">Primary Skills</div>
              <div className="text-sm text-gray-900">{staffDetails?.primary_skills || 'Not provided'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-gray-500 mb-1">Professional Certifications</div>
              <div className="text-sm text-gray-900">{staffDetails?.professional_certifications || 'Not provided'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="shadow-md">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-600" />
            Verification Status
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Reference Check</div>
              <Badge className={
                staffDetails?.reference_check_status === 'pending' 
                  ? 'bg-amber-100 text-amber-700' 
                  : staffDetails?.reference_check_status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }>
                {formatStatus(staffDetails?.reference_check_status)}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Background Verification</div>
              <Badge className={
                staffDetails?.background_verification_status === 'pending' 
                  ? 'bg-amber-100 text-amber-700' 
                  : staffDetails?.background_verification_status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }>
                {formatStatus(staffDetails?.background_verification_status)}
              </Badge>
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

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate('/staff-details-form')}
          className="w-full h-12 bg-[#1A2B3C] hover:bg-[#2C3E50]"
        >
          <Edit className="w-5 h-5 mr-2" />
          Edit Staff Details
        </Button>

        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full h-12 bg-red-600 hover:bg-red-700"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm text-gray-900 font-medium">{value}</div>
    </div>
  );
}
