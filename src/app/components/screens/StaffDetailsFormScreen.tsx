import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Banknote, Phone, MapPin, GraduationCap, FileText, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import apiClient from '@/app/services/api/apiClient';

interface StaffDetails {
  employee_id: string;
  designation: string;
  department_id: string;
  branch_id: string;
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
  bank_ifsc_code: string;
  highest_qualification: string;
  university_school: string;
  year_of_graduation: string;
  professional_certifications: string;
  languages_known: string;
  experience_years: string;
  previous_company: string;
  primary_skills: string;
  allergies: string;
  special_medical_notes: string;
  notice_period_days: string;
}

interface Department {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

export function StaffDetailsFormScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [existingStaffData, setExistingStaffData] = useState<any | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [formData, setFormData] = useState<StaffDetails>({
    employee_id: '',
    designation: '',
    department_id: '',
    branch_id: '',
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
    bank_ifsc_code: '',
    highest_qualification: '',
    university_school: '',
    year_of_graduation: '',
    professional_certifications: '',
    languages_known: '',
    experience_years: '',
    previous_company: '',
    primary_skills: '',
    allergies: '',
    special_medical_notes: '',
    notice_period_days: '30',
  });

  const totalSteps = 5;

  useEffect(() => {
    checkExistingStaffData();
    fetchDepartmentsAndBranches();
  }, []);

  const fetchDepartmentsAndBranches = async () => {
    try {
      const [deptResponse, branchResponse] = await Promise.all([
        apiClient.get('/departments'),
        apiClient.get('/branches')
      ]);

      if (deptResponse.data?.success) {
        setDepartments(deptResponse.data.data.departments || []);
      }
      if (branchResponse.data?.success) {
        setBranches(branchResponse.data.data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching departments/branches:', error);
      // Set default empty arrays on error
      setDepartments([]);
      setBranches([]);
    }
  };

  const checkExistingStaffData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      const response = await apiClient.get(`/staff/${userId}`);
      if (response.data?.success && response.data?.data?.staff) {
        const staff = response.data.data.staff;
        setExistingStaffData(staff);
        
        // Check if form is already filled
        const isFilled = staff.employee_id && staff.designation && staff.phone_number;
        if (isFilled) {
          toast.info('Staff details already submitted');
          navigate('/dashboard');
        } else {
          // Pre-fill with existing data
          setFormData({
            ...formData,
            employee_id: staff.employee_id || '',
            designation: staff.designation || '',
            department: staff.department || '',
            joining_date: staff.joining_date || '',
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
            current_address: staff.current_address_id || '',
            permanent_address: staff.permanent_address_id || '',
            emergency_contact_name: staff.emergency_contact_name || '',
            emergency_contact_phone: staff.emergency_contact_phone || '',
            emergency_contact_relationship: staff.emergency_contact_relationship || '',
            bank_name: staff.bank_name || '',
            bank_account_number: staff.bank_account_number || '',
            bank_ifsc_code: staff.bank_ifsc_code || '',
            tax_identification_number: staff.tax_identification_number || '',
            highest_qualification: staff.highest_qualification || '',
            university_school: staff.university_school || '',
            year_of_graduation: staff.year_of_graduation || '',
            professional_certifications: staff.professional_certifications || '',
            languages_known: staff.languages_known || '',
            experience_years: staff.experience_years || '',
            previous_company: staff.previous_company || '',
            primary_skills: staff.primary_skills || '',
            allergies: staff.allergies || '',
            special_medical_notes: staff.special_medical_notes || '',
            notice_period_days: staff.notice_period_days?.toString() || '30',
          });
        }
      }
    } catch (error: any) {
      console.error('Error checking staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StaffDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1: // Personal Information
        if (!formData.date_of_birth || !formData.gender || !formData.phone_number || !formData.department_id || !formData.branch_id) {
          toast.error('Please fill in all required personal information');
          return false;
        }
        break;
      case 2: // Contact Information
        if (!formData.current_address || !formData.emergency_contact_name || !formData.emergency_contact_phone) {
          toast.error('Please fill in all required contact information');
          return false;
        }
        break;
      case 3: // Bank Information
        if (!formData.bank_name || !formData.bank_account_number || !formData.bank_ifsc_code) {
          toast.error('Please fill in all required bank information');
          return false;
        }
        break;
      case 4: // Education & Skills
        if (!formData.highest_qualification || !formData.primary_skills) {
          toast.error('Please fill in all required education details');
          return false;
        }
        break;
      case 5: // Review - no validation needed
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
        ...formData,
        current_address_id: formData.current_address,
        permanent_address_id: formData.permanent_address,
      };

      const response = await apiClient.put(`/staff/${userId}`, payload);

      if (response.data?.success) {
        toast.success('Staff details submitted successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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
          <Label htmlFor="department_id">Department *</Label>
          <Select value={formData.department_id} onValueChange={(value) => handleInputChange('department_id', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled>Loading departments...</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="branch_id">Branch *</Label>
          <Select value={formData.branch_id} onValueChange={(value) => handleInputChange('branch_id', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled>Loading branches...</SelectItem>
              )}
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

        <div>
          <Label htmlFor="bank_ifsc_code">IFSC Code *</Label>
          <Input
            id="bank_ifsc_code"
            placeholder="Enter IFSC code"
            value={formData.bank_ifsc_code}
            onChange={(e) => handleInputChange('bank_ifsc_code', e.target.value)}
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

  const renderReview = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#1A2B3C]" />
        Review Your Information
      </h3>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C]">Personal Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">DOB:</span> {formData.date_of_birth || '-'}</div>
              <div><span className="text-gray-500">Gender:</span> {formData.gender || '-'}</div>
              <div><span className="text-gray-500">Phone:</span> {formData.phone_number || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {formData.personal_email || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C]">Employment Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Employee ID:</span> {formData.employee_id || '-'}</div>
              <div><span className="text-gray-500">Designation:</span> {formData.designation || '-'}</div>
              <div><span className="text-gray-500">Department:</span> {formData.department || '-'}</div>
              <div><span className="text-gray-500">Joining:</span> {formData.joining_date || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C]">Emergency Contact</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Name:</span> {formData.emergency_contact_name || '-'}</div>
              <div><span className="text-gray-500">Phone:</span> {formData.emergency_contact_phone || '-'}</div>
              <div><span className="text-gray-500">Relationship:</span> {formData.emergency_contact_relationship || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C]">Bank Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Bank:</span> {formData.bank_name || '-'}</div>
              <div><span className="text-gray-500">Account:</span> {formData.bank_account_number ? '****' + formData.bank_account_number.slice(-4) : '-'}</div>
              <div><span className="text-gray-500">IFSC:</span> {formData.bank_ifsc_code || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-medium text-[#1A2B3C]">Education & Skills</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Qualification:</span> {formData.highest_qualification || '-'}</div>
              <div><span className="text-gray-500">School:</span> {formData.university_school || '-'}</div>
              <div><span className="text-gray-500">Skills:</span> {formData.primary_skills ? formData.primary_skills.slice(0, 30) + '...' : '-'}</div>
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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 text-sm">Please fill in your staff details to complete your onboarding</p>
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
              {step === 5 && renderReview()}
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
