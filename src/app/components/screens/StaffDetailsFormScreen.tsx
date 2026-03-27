import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Banknote, Phone, MapPin, GraduationCap, FileText, AlertCircle, CheckCircle, Save, ArrowRight, ArrowLeft, Users, Heart, Calendar, DollarSign, FileCheck, Camera, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Progress } from '@/app/components/ui/progress';
import { Switch } from '@/app/components/ui/switch';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import apiClient from '@/app/services/api/apiClient';

interface Dependent {
  id: string;
  name: string;
  relationship: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  is_primary: boolean;
}

interface StaffDetails {
  employee_id: string;
  designation: string;
  department_id: string;
  department_name: string; // Added for display
  branch_id: string;
  branch_name: string; // Added for display
  joining_date: string;
  employment_type: string;
  work_mode: string;
  work_email: string;
  personal_email: string;
  phone_number: string;
  alternate_phone_number: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  current_address: string;
  permanent_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  bank_name: string;
  bank_account_number: string;
  // bank_ifsc_code: string;
  tax_identification_number: string;
  highest_qualification: string;
  university_school: string;
  year_of_graduation: string;
  course_of_study: string;
  professional_certifications: string;
  languages_known: string;
  experience_years: string;
  previous_company: string;
  primary_skills: string;
  allergies: string;
  special_medical_notes: string;
  notice_period_days: string;
  weekly_working_hours: string;
  overtime_eligibility: boolean;
  probation_end_date: string;
  contract_end_date: string;
  medical_insurance_id: string;
  pension_insurance_id: string;
  gratuity_applicable: boolean;
  assigned_location_id: string;
  dependents: Dependent[];
}

interface Department {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

export function StaffDetailsFormScreen() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [existingStaffData, setExistingStaffData] = useState<any | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  
  // Removed - no longer fetching departments/branches for selection
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Image upload state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<StaffDetails>({
    employee_id: '',
    designation: '',
    department_id: '',
    department_name: '',
    branch_id: '',
    branch_name: '',
    joining_date: '',
    employment_type: 'permanent',
    work_mode: 'onsite',
    work_email: '',
    personal_email: '',
    phone_number: '',
    alternate_phone_number: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    blood_group: '',
    current_address: '',
    permanent_address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    bank_name: '',
    bank_account_number: '',
    // bank_ifsc_code: '',
    tax_identification_number: '',
    highest_qualification: '',
    university_school: '',
    year_of_graduation: '',
    course_of_study: '',
    professional_certifications: '',
    languages_known: '',
    experience_years: '',
    previous_company: '',
    primary_skills: '',
    allergies: '',
    special_medical_notes: '',
    notice_period_days: '30',
    weekly_working_hours: '40',
    overtime_eligibility: false,
    probation_end_date: '',
    contract_end_date: '',
    medical_insurance_id: '',
    pension_insurance_id: '',
    gratuity_applicable: true,
    assigned_location_id: '',
    dependents: [],
  });

  const totalSteps = 6; // Reduced from 7 - removed Employment Details step (now set by HR)

  // Calculate completion percentage based on filled fields
  const calculateCompletionPercentage = () => {
    const requiredFields = [
      formData.date_of_birth,
      formData.gender,
      formData.phone_number,
      formData.department_id,
      formData.branch_id,
      formData.current_address,
      formData.emergency_contact_name,
      formData.emergency_contact_phone,
      formData.bank_name,
      formData.bank_account_number,
      // formData.bank_ifsc_code,
      formData.highest_qualification,
      formData.primary_skills,
      formData.weekly_working_hours,
      formData.overtime_eligibility !== undefined,
      formData.gratuity_applicable !== undefined,
    ];
    
    const filledFields = requiredFields.filter(field => {
      if (typeof field === 'boolean') return field !== undefined;
      return field && field.trim() !== '';
    }).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const completionPercentage = calculateCompletionPercentage();

  useEffect(() => {
    checkExistingStaffData();
    fetchDepartmentsAndBranches();
  }, []);

  const fetchDepartmentsAndBranches = async () => {
    try {
      // Fetch departments and branches in parallel
      const [deptResponse, branchResponse] = await Promise.all([
        apiClient.get('/staff-invitation/departments'),
        apiClient.get('/staff-invitation/branches')
      ]);

      if (deptResponse.data?.success) {
        setDepartments(deptResponse.data.data.departments || []);
      }
      if (branchResponse.data?.success) {
        setBranches(branchResponse.data.data.branches || []);
      }
      
      // Locations endpoint is optional - fetch separately to avoid blocking
      try {
        const locationResponse = await apiClient.get('/locations');
        if (locationResponse.data?.success) {
          setLocations(locationResponse.data.data.locations || []);
        }
      } catch (locationError) {
        // Locations endpoint may not exist - use empty array
        console.warn('Locations endpoint not available, using empty list');
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching departments/branches:', error);
      setDepartments([]);
      setBranches([]);
      setLocations([]);
    }
  };

  const checkExistingStaffData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User ID not found');
        navigate('/login');
        return;
      }

      // Get staff data which includes invitation info
      // Note: New users may not have a staff record yet - that's OK
      const response = await apiClient.get(`/staff/${userId}`);
      
      if (response.status === 404) {
        // No staff record yet - this is normal for new users
        console.log('No staff record found, user will complete profile');
        setLoading(false);
        return;
      }
      
      if (response.data?.success && response.data?.data?.staff) {
        const staff = response.data.data.staff;
        console.log('[StaffDetailsForm] Loaded existing staff data:', staff);
        console.log('[StaffDetailsForm] Staff profile_picture:', staff.profile_picture);
        setExistingStaffData(staff);

        // Load existing profile picture if available
        if (staff.profile_picture) {
          setProfileImagePreview(staff.profile_picture);
          console.log('[StaffDetailsForm] Set profile image preview:', staff.profile_picture);
        }

        // Check if form is already filled - check critical fields
        const isFilled = staff.employee_id && staff.designation && staff.phone_number &&
                        staff.date_of_birth && staff.gender && staff.department_id &&
                        staff.branch_id && staff.current_address_id &&
                        staff.emergency_contact_name && staff.bank_name;

        if (isFilled) {
          toast.info('Staff profile already completed');
          // Update user context to mark profile as complete
          if (user) {
            updateUser({
              ...user,
              needs_profile_completion: false
            });
          }
          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          // Parse dependents from JSON if exists
          let dependentsData: Dependent[] = [];
          if (staff.dependents && typeof staff.dependents === 'string') {
            try {
              dependentsData = JSON.parse(staff.dependents);
            } catch (e) {
              console.error('Failed to parse dependents:', e);
            }
          } else if (Array.isArray(staff.dependents)) {
            dependentsData = staff.dependents;
          }

          // Pre-fill with existing data (department/branch from invitation or user selection)
          const prefilledFormData = {
            employee_id: staff.employee_id || `EMP${userId}`,
            designation: staff.designation || '',
            department_id: staff.department_id?.toString() || '',
            branch_id: staff.branch_id?.toString() || '',
            joining_date: staff.joining_date || new Date().toISOString().split('T')[0],
            employment_type: staff.employment_type || 'permanent',
            work_mode: staff.work_mode || 'onsite',
            work_email: staff.work_email || '',
            personal_email: staff.personal_email || '',
            phone_number: staff.phone_number || '',
            alternate_phone_number: staff.alternate_phone_number || '',
            date_of_birth: staff.date_of_birth || '',
            gender: staff.gender || '',
            marital_status: staff.marital_status || '',
            blood_group: staff.blood_group || '',
            current_address: staff.current_address || '',
            permanent_address: staff.permanent_address || '',
            emergency_contact_name: staff.emergency_contact_name || '',
            emergency_contact_phone: staff.emergency_contact_phone || '',
            emergency_contact_relationship: staff.emergency_contact_relationship || '',
            bank_name: staff.bank_name || '',
            bank_account_number: staff.bank_account_number || '',
            tax_identification_number: staff.tax_identification_number || '',
            highest_qualification: staff.highest_qualification || '',
            university_school: staff.university_school || '',
            year_of_graduation: staff.year_of_graduation || '',
            course_of_study: staff.course_of_study || '',
            professional_certifications: staff.professional_certifications || '',
            languages_known: staff.languages_known || '',
            experience_years: staff.experience_years || '',
            previous_company: staff.previous_company || '',
            primary_skills: staff.primary_skills || '',
            allergies: staff.allergies || '',
            special_medical_notes: staff.special_medical_notes || '',
            notice_period_days: staff.notice_period_days?.toString() || '30',
            weekly_working_hours: staff.weekly_working_hours?.toString() || '40',
            overtime_eligibility: staff.overtime_eligibility ?? false,
            probation_end_date: staff.probation_end_date || '',
            contract_end_date: staff.contract_end_date || '',
            medical_insurance_id: staff.medical_insurance_id || '',
            pension_insurance_id: staff.pension_insurance_id || '',
            gratuity_applicable: staff.gratuity_applicable ?? true,
            assigned_location_id: staff.assigned_location_id?.toString() || '',
            dependents: dependentsData,
          };
          console.log('[StaffDetailsForm] Setting prefilled form data:', prefilledFormData);
          setFormData(prefilledFormData);
        }
      }
    } catch (error: any) {
      // Handle 404 gracefully - no staff record yet
      if (error.response?.status === 404) {
        console.log('No staff record found, user will complete profile');
      } else {
        console.error('Error checking staff data:', error);
        toast.error('Unable to load existing data. Please fill in your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StaffDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image upload handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProfileImage = async (userId: number): Promise<string | null> => {
    if (!profileImage) return null;

    try {
      setUploadingImage(true);
      const formDataImg = new FormData();
      formDataImg.append('profile_picture', profileImage);

      const response = await apiClient.post(`/staff/${userId}/upload-photo`, formDataImg, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        return response.data.data.profile_picture_url;
      }
      return null;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1: // Personal Information
        if (!formData.date_of_birth || !formData.gender || !formData.phone_number) {
          toast.error('Please fill in all required personal information fields marked with *');
          return false;
        }
        // Validate phone number format (basic validation)
        const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        if (!phoneRegex.test(formData.phone_number)) {
          toast.error('Please enter a valid phone number');
          return false;
        }
        break;
      case 2: // Contact Information
        if (!formData.current_address || !formData.emergency_contact_name || !formData.emergency_contact_phone) {
          toast.error('Please fill in all required contact information fields marked with *');
          return false;
        }
        // Validate emergency contact phone
        const emergencyPhoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        if (!emergencyPhoneRegex.test(formData.emergency_contact_phone)) {
          toast.error('Please enter a valid emergency contact phone number');
          return false;
        }
        break;
      case 3: // Bank Information
        if (!formData.bank_name || !formData.bank_account_number) {
          toast.error('Please fill in all required bank information fields marked with *');
          return false;
        }
        break;
      case 4: // Education & Skills
        if (!formData.highest_qualification || !formData.primary_skills) {
          toast.error('Please fill in all required education details fields marked with *');
          return false;
        }
        break;
      case 5: // Dependents - optional, no validation
        break;
      case 6: // Review - no validation needed
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      const payload = {
        employee_id: formData.employee_id || `EMP${userId}`,
        designation: formData.designation,
        // Don't send department_id, branch_id, employment_type, work_mode - they're set by HR
        joining_date: formData.joining_date,
        work_email: formData.work_email,
        personal_email: formData.personal_email,
        phone_number: formData.phone_number,
        alternate_phone_number: formData.alternate_phone_number,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        marital_status: formData.marital_status,
        blood_group: formData.blood_group,
        current_address: formData.current_address,
        permanent_address: formData.permanent_address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        // bank_ifsc_code: formData.bank_ifsc_code,
        tax_identification_number: formData.tax_identification_number,
        highest_qualification: formData.highest_qualification,
        university_school: formData.university_school,
        year_of_graduation: formData.year_of_graduation,
        course_of_study: formData.course_of_study || '',
        professional_certifications: formData.professional_certifications,
        languages_known: formData.languages_known,
        experience_years: formData.experience_years,
        previous_company: formData.previous_company,
        primary_skills: formData.primary_skills,
        allergies: formData.allergies,
        special_medical_notes: formData.special_medical_notes,
        notice_period_days: parseInt(formData.notice_period_days) || 30,
        weekly_working_hours: parseFloat(formData.weekly_working_hours) || 40,
        overtime_eligibility: formData.overtime_eligibility,
        probation_end_date: formData.probation_end_date || null,
        contract_end_date: formData.contract_end_date || null,
        medical_insurance_id: formData.medical_insurance_id || null,
        pension_insurance_id: formData.pension_insurance_id || null,
        gratuity_applicable: formData.gratuity_applicable,
        assigned_location_id: formData.assigned_location_id ? parseInt(formData.assigned_location_id) : null,
        dependents: formData.dependents.length > 0 ? JSON.stringify(formData.dependents) : null,
      };

      // userId already declared at start of handleSubmit
      console.log('========================================');
      console.log('[Frontend] Submitting staff details');
      console.log('[Frontend] userId from localStorage:', userId);
      console.log('[Frontend] userId type:', typeof userId);
      console.log('[Frontend] userId as number:', Number(userId));
      console.log('[Frontend] Request URL:', `/staff/${userId}`);
      console.log('[Frontend] Payload keys:', Object.keys(payload));
      console.log('[Frontend] Payload:', JSON.stringify(payload, null, 2));
      console.log('========================================');

      const response = await apiClient.put(`/staff/${userId}`, payload);

      if (response.data?.success) {
        // Upload profile image if provided
        let profileImageUrl = null;
        if (profileImage) {
          profileImageUrl = await uploadProfileImage(userId);
        }

        toast.success('Profile completed successfully! Redirecting to dashboard...');

        // Update user context to mark profile as complete
        if (user) {
          updateUser({
            ...user,
            needs_profile_completion: false,
            avatar: profileImageUrl || user.avatar
          });
        }

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        toast.error(response.data?.message || 'Failed to submit details');
      }
    } catch (error: any) {
      console.error('Error submitting staff details:', error);
      toast.error(error.response?.data?.message || 'Failed to submit details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              stepNum <= step
                ? 'bg-[#1A2B3C] text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {stepNum < step ? <CheckCircle className="w-5 h-5" /> : stepNum}
          </div>
          {stepNum < totalSteps && (
            <div
              className={`w-8 md:w-12 h-0.5 ${
                stepNum < step ? 'bg-[#1A2B3C]' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5 text-[#1A2B3C]" />
        Personal Information
      </h3>

      {/* Profile Image Upload */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Profile Photo</Label>
        <div className="flex items-center gap-4">
          {profileImagePreview ? (
            <div className="relative">
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-[#1A2B3C]"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="profile-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A2B3C]" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="marital_status">Marital Status</Label>
          <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="blood_group">Blood Group</Label>
          <Select value={formData.blood_group} onValueChange={(value) => handleInputChange('blood_group', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="phone_number">Phone Number *</Label>
          <Input
            id="phone_number"
            type="tel"
            placeholder="+254 7XX XXX XXX"
            value={formData.phone_number}
            onChange={(e) => handleInputChange('phone_number', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="alternate_phone_number">Alternate Phone Number</Label>
          <Input
            id="alternate_phone_number"
            type="tel"
            placeholder="+254 7XX XXX XXX"
            value={formData.alternate_phone_number}
            onChange={(e) => handleInputChange('alternate_phone_number', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="personal_email">Personal Email</Label>
          <Input
            id="personal_email"
            type="email"
            placeholder="your@email.com"
            value={formData.personal_email}
            onChange={(e) => handleInputChange('personal_email', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="allergies">Allergies (if any)</Label>
          <Input
            id="allergies"
            placeholder="List any allergies"
            value={formData.allergies}
            onChange={(e) => handleInputChange('allergies', e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="special_medical_notes">Special Medical Notes</Label>
          <Textarea
            id="special_medical_notes"
            placeholder="Any medical conditions we should be aware of"
            value={formData.special_medical_notes}
            onChange={(e) => handleInputChange('special_medical_notes', e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#1A2B3C]" />
        Contact & Address Information
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="current_address">Current Address *</Label>
          <Textarea
            id="current_address"
            placeholder="Enter your current residential address"
            value={formData.current_address}
            onChange={(e) => handleInputChange('current_address', e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="permanent_address">Permanent Address</Label>
          <Textarea
            id="permanent_address"
            placeholder="Enter your permanent address"
            value={formData.permanent_address}
            onChange={(e) => handleInputChange('permanent_address', e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Emergency Contact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">Contact Name *</Label>
              <Input
                id="emergency_contact_name"
                placeholder="Full name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_relationship">Relationship *</Label>
              <Select value={formData.emergency_contact_relationship} onValueChange={(value) => handleInputChange('emergency_contact_relationship', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBankInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-[#1A2B3C]" />
        Bank Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bank_name">Bank Name *</Label>
          <Input
            id="bank_name"
            placeholder="e.g., KCB Bank"
            value={formData.bank_name}
            onChange={(e) => handleInputChange('bank_name', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bank_account_number">Account Number *</Label>
          <Input
            id="bank_account_number"
            placeholder="Enter account number"
            value={formData.bank_account_number}
            onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-[#1A2B3C]" />
        Education & Skills
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="highest_qualification">Highest Qualification *</Label>
          <Select value={formData.highest_qualification} onValueChange={(value) => handleInputChange('highest_qualification', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ond">OND (Ordinary National Diploma)</SelectItem>
              <SelectItem value="hnd">HND (Higher National Diploma)</SelectItem>
              <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
              <SelectItem value="masters">Master's Degree</SelectItem>
              <SelectItem value="phd">PhD</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="university_school">University / School</Label>
          <Input
            id="university_school"
            placeholder="Institution name"
            value={formData.university_school}
            onChange={(e) => handleInputChange('university_school', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="year_of_graduation">Year of Graduation</Label>
          <Input
            id="year_of_graduation"
            type="number"
            placeholder="2020"
            value={formData.year_of_graduation}
            onChange={(e) => handleInputChange('year_of_graduation', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="course_of_study">Course of Study</Label>
          <Input
            id="course_of_study"
            placeholder="e.g., Computer Science, Accounting"
            value={formData.course_of_study || ''}
            onChange={(e) => handleInputChange('course_of_study', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="languages_known">Languages Known</Label>
          <Input
            id="languages_known"
            placeholder="English, Yoruba, Hausa"
            value={formData.languages_known}
            onChange={(e) => handleInputChange('languages_known', e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="primary_skills">Primary Skills *</Label>
          <Textarea
            id="primary_skills"
            placeholder="List your primary skills (comma separated)"
            value={formData.primary_skills}
            onChange={(e) => handleInputChange('primary_skills', e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="professional_certifications">Professional Certifications</Label>
          <Textarea
            id="professional_certifications"
            placeholder="List any professional certifications"
            value={formData.professional_certifications}
            onChange={(e) => handleInputChange('professional_certifications', e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderEmploymentDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-[#1A2B3C]" />
        Employment Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="joining_date">Joining Date *</Label>
          <Input
            id="joining_date"
            type="date"
            value={formData.joining_date}
            onChange={(e) => handleInputChange('joining_date', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="employment_type">Employment Type *</Label>
          <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Permanent</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="work_mode">Work Mode *</Label>
          <Select value={formData.work_mode} onValueChange={(value) => handleInputChange('work_mode', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="weekly_working_hours">Weekly Working Hours *</Label>
          <Input
            id="weekly_working_hours"
            type="number"
            placeholder="40"
            value={formData.weekly_working_hours}
            onChange={(e) => handleInputChange('weekly_working_hours', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="overtime_eligibility">Overtime Eligible</Label>
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={formData.overtime_eligibility}
              onCheckedChange={(checked) => handleInputChange('overtime_eligibility', String(checked))}
            />
            <span className="text-sm text-gray-600">{formData.overtime_eligibility ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div>
          <Label htmlFor="notice_period_days">Notice Period (Days)</Label>
          <Input
            id="notice_period_days"
            type="number"
            placeholder="30"
            value={formData.notice_period_days}
            onChange={(e) => handleInputChange('notice_period_days', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="probation_end_date">Probation End Date</Label>
          <Input
            id="probation_end_date"
            type="date"
            value={formData.probation_end_date}
            onChange={(e) => handleInputChange('probation_end_date', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="contract_end_date">Contract End Date (if applicable)</Label>
          <Input
            id="contract_end_date"
            type="date"
            value={formData.contract_end_date}
            onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="assigned_location_id">Primary Work Location</Label>
          <Select value={formData.assigned_location_id} onValueChange={(value) => handleInputChange('assigned_location_id', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled>Loading locations...</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="gratuity_applicable">Gratuity Applicable</Label>
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={formData.gratuity_applicable}
              onCheckedChange={(checked) => handleInputChange('gratuity_applicable', String(checked))}
            />
            <span className="text-sm text-gray-600">{formData.gratuity_applicable ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Add or update dependent
  const handleAddDependent = () => {
    const newDependent: Dependent = {
      id: Date.now().toString(),
      name: '',
      relationship: '',
      date_of_birth: '',
      gender: '',
      phone_number: '',
      is_primary: formData.dependents.length === 0,
    };
    setFormData(prev => ({
      ...prev,
      dependents: [...prev.dependents, newDependent],
    }));
  };

  const handleUpdateDependent = (id: string, field: keyof Dependent, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      dependents: prev.dependents.map(dep => 
        dep.id === id ? { ...dep, [field]: value } : dep
      ),
    }));
  };

  const handleRemoveDependent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      dependents: prev.dependents.filter(dep => dep.id !== id),
    }));
  };

  const renderDependents = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Users className="w-5 h-5 text-[#1A2B3C]" />
        Dependents Information
      </h3>
      <p className="text-sm text-gray-600">
        Add information about people who depend on you (spouse, children, parents, etc.). This information is used for benefits and emergency purposes.
      </p>

      {formData.dependents.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No dependents added yet</p>
          <p className="text-gray-400 text-xs">Click "Add Dependent" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.dependents.map((dependent, index) => (
            <Card key={dependent.id} className="border-l-4 border-l-[#1A2B3C]">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Dependent #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDependent(dependent.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`dep-name-${dependent.id}`}>Full Name *</Label>
                    <Input
                      id={`dep-name-${dependent.id}`}
                      placeholder="Full name"
                      value={dependent.name}
                      onChange={(e) => handleUpdateDependent(dependent.id, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`dep-relation-${dependent.id}`}>Relationship *</Label>
                    <Select value={dependent.relationship} onValueChange={(value) => handleUpdateDependent(dependent.id, 'relationship', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="son">Son</SelectItem>
                        <SelectItem value="daughter">Daughter</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`dep-dob-${dependent.id}`}>Date of Birth</Label>
                    <Input
                      id={`dep-dob-${dependent.id}`}
                      type="date"
                      value={dependent.date_of_birth}
                      onChange={(e) => handleUpdateDependent(dependent.id, 'date_of_birth', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`dep-gender-${dependent.id}`}>Gender</Label>
                    <Select value={dependent.gender} onValueChange={(value) => handleUpdateDependent(dependent.id, 'gender', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`dep-phone-${dependent.id}`}>Phone Number</Label>
                    <Input
                      id={`dep-phone-${dependent.id}`}
                      type="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={dependent.phone_number}
                      onChange={(e) => handleUpdateDependent(dependent.id, 'phone_number', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={dependent.is_primary}
                      onCheckedChange={(checked) => handleUpdateDependent(dependent.id, 'is_primary', checked)}
                    />
                    <Label htmlFor={`dep-primary-${dependent.id}`} className="text-sm">
                      Primary Dependent
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        type="button"
        onClick={handleAddDependent}
        variant="outline"
        className="w-full border-dashed border-2 hover:bg-gray-50"
      >
        <Users className="w-4 h-4 mr-2" />
        Add Dependent
      </Button>

      {formData.dependents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You can add multiple dependents. Mark one as "Primary Dependent" for emergency contact purposes.
          </p>
        </div>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#1A2B3C]" />
        Review Your Information
      </h3>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C] flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">DOB:</span> {formData.date_of_birth || '-'}</div>
              <div><span className="text-gray-500">Gender:</span> {formData.gender || '-'}</div>
              <div><span className="text-gray-500">Phone:</span> {formData.phone_number || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {formData.personal_email || '-'}</div>
              <div><span className="text-gray-500">Marital Status:</span> {formData.marital_status || '-'}</div>
              <div><span className="text-gray-500">Blood Group:</span> {formData.blood_group || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details removed - now set by HR during invitation */}

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C] flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Contact & Address
            </h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Current Address:</span> {formData.current_address || '-'}</div>
              <div><span className="text-gray-500">Permanent Address:</span> {formData.permanent_address || '-'}</div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div><span className="text-gray-500">Emergency Name:</span> {formData.emergency_contact_name || '-'}</div>
                <div><span className="text-gray-500">Emergency Phone:</span> {formData.emergency_contact_phone || '-'}</div>
                <div><span className="text-gray-500">Relationship:</span> {formData.emergency_contact_relationship || '-'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C] flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Bank Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Bank:</span> {formData.bank_name || '-'}</div>
              <div><span className="text-gray-500">Account:</span> {formData.bank_account_number ? '****' + formData.bank_account_number.slice(-4) : '-'}</div>
              {/* <div><span className="text-gray-500">IFSC:</span> {formData.bank_ifsc_code || '-'}</div> */}
              <div><span className="text-gray-500">PAN/TIN:</span> {formData.tax_identification_number || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C] flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Education & Skills
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Qualification:</span> {formData.highest_qualification || '-'}</div>
              <div><span className="text-gray-500">School:</span> {formData.university_school || '-'}</div>
              <div><span className="text-gray-500">Year:</span> {formData.year_of_graduation || '-'}</div>
              <div><span className="text-gray-500">Languages:</span> {formData.languages_known || '-'}</div>
              <div className="col-span-2"><span className="text-gray-500">Skills:</span> {formData.primary_skills || '-'}</div>
              <div className="col-span-2"><span className="text-gray-500">Certifications:</span> {formData.professional_certifications || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {formData.dependents.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-medium text-[#1A2B3C] flex items-center gap-2">
                <Users className="w-4 h-4" />
                Dependents ({formData.dependents.length})
              </h4>
              <div className="space-y-3">
                {formData.dependents.map((dep, idx) => (
                  <div key={dep.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="font-medium text-gray-900">
                      {dep.name} {dep.is_primary && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">Primary</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-600 mt-1">
                      <span>Relationship: {dep.relationship}</span>
                      <span>DOB: {dep.date_of_birth || '-'}</span>
                      <span>Gender: {dep.gender || '-'}</span>
                      <span>Phone: {dep.phone_number || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C] flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Medical & Other
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Allergies:</span> {formData.allergies || '-'}</div>
              <div><span className="text-gray-500">Medical Notes:</span> {formData.special_medical_notes || '-'}</div>
              <div><span className="text-gray-500">Experience:</span> {formData.experience_years ? `${formData.experience_years} years` : '-'}</div>
              <div><span className="text-gray-500">Previous Company:</span> {formData.previous_company || '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Please verify all information before submitting</p>
          <p>Once submitted, you may need to contact HR to make changes to your staff details.</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600 text-sm">Please fill in your staff details to complete your onboarding</p>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-[#1A2B3C]">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {completionPercentage < 100 
                ? `${100 - completionPercentage}% remaining - please complete all required fields`
                : 'All required fields completed! Ready to submit.'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
              {step === 1 && renderPersonalInfo()}
              {step === 2 && renderContactInfo()}
              {step === 3 && renderBankInfo()}
              {step === 4 && renderEducation()}
              {step === 5 && renderDependents()}
              {step === 6 && renderReview()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="px-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-6 bg-[#1A2B3C] hover:bg-[#2C3E50]"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Details
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Fields marked with * are required</p>
          <p className="mt-1">Need help? Contact HR at hr@company.com</p>
        </div>
      </div>
    </div>
  );
}
