import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Edit2, Trash2, Upload, Download, Eye, CheckCircle,
  AlertCircle, X, Save, Phone, Mail, MapPin, Briefcase, FileText,
  Calendar, User, Shield, ChevronDown, RefreshCw
} from 'lucide-react';
import { guarantorApi, Guarantor, GuarantorInput } from '../services/api/guarantorApi';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { toast } from 'sonner';

// Nigerian states for dropdown
const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  'FCT'
];

const idTypeOptions = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_card', label: "Voter's Card" },
  { value: 'other', label: 'Other' }
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const guaranteeTypeOptions = [
  { value: 'personal', label: 'Personal Guarantee' },
  { value: 'financial', label: 'Financial Guarantee' },
  { value: 'both', label: 'Both Personal & Financial' }
];

const relationshipOptions = [
  'Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Colleague', 'Other'
];

const occupationOptions = [
  'Business Owner', 'Civil Servant', 'Teacher', 'Doctor', 'Lawyer',
  'Engineer', 'Accountant', 'Manager', 'Nurse', 'Driver',
  'Farmer', 'Trader', 'Student', 'Retired', 'Other'
];

export default function GuarantorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedGuarantor, setSelectedGuarantor] = useState<Guarantor | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ type: string; path: string; name: string } | null>(null);

  // Form state
  const emptyForm: GuarantorInput = {
    staff_id: 0, // Will be set from logged-in user
    first_name: '',
    last_name: '',
    middle_name: '',
    phone_number: '',
    email: '',
    relationship: '',
    occupation: '',
    guarantee_type: 'personal',
    address_line_1: '',
    city: '',
    state: '',
    country: 'Nigeria',
    is_active: true
  };

  const [formData, setFormData] = useState<GuarantorInput>(emptyForm);

  useEffect(() => {
    loadGuarantors();
  }, []);

  const loadGuarantors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's staff ID first
      const staffResponse = await fetch('/api/staff/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!staffResponse.ok) {
        throw new Error('Failed to load staff profile');
      }

      const staffData = await staffResponse.json();
      const staffId = staffData.data.staff.id;

      // Load guarantors
      const response = await guarantorApi.getGuarantors(staffId);
      if (response.success) {
        setGuarantors(response.data.guarantors);
      }
    } catch (err: any) {
      console.error('Error loading guarantors:', err);
      setError(err.message || 'Failed to load guarantors');
      toast.error('Failed to load guarantors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedGuarantor) {
        // Update existing
        const response = await guarantorApi.updateGuarantor(selectedGuarantor.id, formData);
        if (response.success) {
          toast.success('Guarantor updated successfully');
          resetForm();
          loadGuarantors();
        }
      } else {
        // Create new
        const response = await guarantorApi.createGuarantor(formData);
        if (response.success) {
          toast.success('Guarantor added successfully');
          resetForm();
          loadGuarantors();
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to save guarantor');
      setError(err.response?.data?.message || 'Failed to save guarantor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedGuarantor(null);
    setShowForm(false);
    setError(null);
  };

  const handleEdit = (guarantor: Guarantor) => {
    // Prevent editing verified guarantors
    if (guarantor.is_verified) {
      toast.error('Cannot edit verified guarantor. Please contact HR admin.');
      return;
    }

    setFormData({
      ...guarantor,
      date_of_birth: guarantor.date_of_birth ? guarantor.date_of_birth.split('T')[0] : '',
      id_issue_date: guarantor.id_issue_date ? guarantor.id_issue_date.split('T')[0] : '',
      id_expiry_date: guarantor.id_expiry_date ? guarantor.id_expiry_date.split('T')[0] : '',
      guarantee_start_date: guarantor.guarantee_start_date ? guarantor.guarantee_start_date.split('T')[0] : '',
      guarantee_end_date: guarantor.guarantee_end_date ? guarantor.guarantee_end_date.split('T')[0] : ''
    });
    setSelectedGuarantor(guarantor);
    setShowForm(true);
  };

  const handleDelete = async (guarantorId: number, guarantorName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${guarantorName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await guarantorApi.deleteGuarantor(guarantorId);
      if (response.success) {
        toast.success('Guarantor deleted successfully');
        loadGuarantors();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete guarantor');
    }
  };

  const handleUploadDocument = async (guarantorId: number, documentType: 'form' | 'id', file: File) => {
    try {
      setUploadingDoc(true);
      const response = await guarantorApi.uploadDocument(guarantorId, documentType, file);
      if (response.success) {
        toast.success('Document uploaded successfully');
        loadGuarantors();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleInputChange = (field: keyof GuarantorInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Form Field Component
  const FormField = ({
    label,
    field,
    type = 'text',
    required = false,
    options = [],
    icon: Icon
  }: any) => (
    <div className="space-y-1">
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4" />}
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {type === 'textarea' ? (
        <Textarea
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          rows={3}
          required={required}
          className="w-full"
        />
      ) : type === 'select' ? (
        <div className="relative">
          <select
            value={(formData[field] as string) || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={required}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="">Select {label}</option>
            {options.map((opt: any) => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      ) : (
        <Input
          type={type}
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={required}
          className="w-full"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Guarantors</h1>
              <p className="text-sm text-gray-600">Manage your guarantor information</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: 600
            }}
          >
            <Plus className="w-4 h-4" />
            Add Guarantor
          </Button>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm">About Guarantors</h3>
              <p className="text-xs text-blue-700 mt-1">
                Guarantors provide a guarantee or reference for your employment. 
                You must add at least one guarantor who can vouch for your character. 
                Upload signed guarantor forms and ID documents for verification.
              </p>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>⚠️ Important:</strong> Once a guarantor is verified by HR, you cannot edit or delete it. 
                Contact HR admin if you need to make changes to verified guarantors.
              </div>
            </div>
          </div>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}

        {successMessage && (
          <Card className="p-4 bg-green-50 border-green-200 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">{successMessage}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Guarantors List */}
      <div className="max-w-6xl mx-auto">
        {loading && !showForm ? (
          <Card className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading guarantors...</p>
          </Card>
        ) : guarantors.length === 0 && !showForm ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guarantors Yet</h3>
            <p className="text-gray-600 mb-4">Add your first guarantor to get started</p>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 mx-auto"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 600
              }}
            >
              <Plus className="w-4 h-4" />
              Add Your First Guarantor
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {guarantors.map((guarantor) => (
              <Card key={guarantor.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {guarantor.first_name[0]}{guarantor.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {guarantor.first_name} {guarantor.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{guarantor.relationship} • {guarantor.occupation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {guarantor.is_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{guarantor.phone_number}</span>
                  </div>
                  {guarantor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{guarantor.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{guarantor.city}, {guarantor.state}</span>
                  </div>
                </div>

                {/* Documents */}
                <div className="border-t pt-3 mb-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Documents</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {guarantor.guarantor_form_path ? (
                      <button
                        onClick={() => setViewingDoc({
                          type: 'pdf',
                          path: `http://localhost:3000${guarantor.guarantor_form_path}`,
                          name: 'Guarantor Form'
                        })}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Form
                      </button>
                    ) : (
                      <label className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Upload Form
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadDocument(guarantor.id, 'form', e.target.files[0]);
                            }
                          }}
                          className="hidden"
                          disabled={uploadingDoc}
                        />
                      </label>
                    )}

                    {guarantor.id_document_path ? (
                      <button
                        onClick={() => setViewingDoc({
                          type: 'pdf',
                          path: `http://localhost:3000${guarantor.id_document_path}`,
                          name: 'ID Document'
                        })}
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        ID
                      </button>
                    ) : (
                      <label className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Upload ID
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadDocument(guarantor.id, 'id', e.target.files[0]);
                            }
                          }}
                          className="hidden"
                          disabled={uploadingDoc}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  {/* Only show Edit/Delete if NOT verified (pending submission) */}
                  {!guarantor.is_verified ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(guarantor)}
                        className="flex-1 text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(guarantor.id, `${guarantor.first_name} ${guarantor.last_name}`)}
                        className="text-red-600 hover:text-red-700 text-xs"
                        title="Delete pending guarantor"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="w-full text-center py-2">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified - Cannot edit
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedGuarantor ? 'Edit Guarantor' : 'Add New Guarantor'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="First Name" field="first_name" required icon={User} />
                    <FormField label="Middle Name" field="middle_name" icon={User} />
                    <FormField label="Last Name" field="last_name" required icon={User} />
                    <FormField label="Date of Birth" field="date_of_birth" type="date" icon={Calendar} />
                    <FormField label="Gender" field="gender" type="select" options={genderOptions} icon={User} />
                    <FormField label="Phone Number" field="phone_number" type="tel" required icon={Phone} />
                    <FormField label="Alternate Phone" field="alternate_phone" type="tel" icon={Phone} />
                    <FormField label="Email" field="email" type="email" icon={Mail} />
                    <FormField label="Relationship" field="relationship" type="select" options={relationshipOptions} icon={User} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Address Line 1" field="address_line_1" required icon={MapPin} />
                    <FormField label="Address Line 2" field="address_line_2" icon={MapPin} />
                    <FormField label="City" field="city" icon={MapPin} />
                    <FormField label="State" field="state" type="select" options={nigerianStates} icon={MapPin} />
                    <FormField label="Postal Code" field="postal_code" icon={MapPin} />
                    <FormField label="Country" field="country" icon={MapPin} />
                  </div>
                </div>

                {/* Identification */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Identification Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="ID Type" field="id_type" type="select" options={idTypeOptions} icon={Shield} />
                    <FormField label="ID Number" field="id_number" icon={Shield} />
                    <FormField label="Issuing Authority" field="id_issuing_authority" icon={Shield} />
                    <FormField label="Issue Date" field="id_issue_date" type="date" icon={Calendar} />
                    <FormField label="Expiry Date" field="id_expiry_date" type="date" icon={Calendar} />
                  </div>
                </div>

                {/* Employment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Employment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Occupation" field="occupation" type="select" options={occupationOptions} icon={Briefcase} />
                    <FormField label="Employer Name" field="employer_name" icon={Briefcase} />
                    <FormField label="Employer Address" field="employer_address" icon={MapPin} />
                    <FormField label="Employer Phone" field="employer_phone" type="tel" icon={Phone} />
                  </div>
                </div>

                {/* Guarantee Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Guarantee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Guarantee Type" field="guarantee_type" type="select" options={guaranteeTypeOptions} icon={FileText} />
                    <FormField label="Guarantee Amount (₦)" field="guarantee_amount" type="number" icon={FileText} />
                    <FormField label="Start Date" field="guarantee_start_date" type="date" icon={Calendar} />
                    <FormField label="End Date" field="guarantee_end_date" type="date" icon={Calendar} />
                    <div className="md:col-span-3">
                      <FormField label="Terms & Conditions" field="guarantee_terms" type="textarea" icon={FileText} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 flex items-center gap-2"
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {selectedGuarantor ? 'Update' : 'Create'} Guarantor
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold">{viewingDoc.name}</h3>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {viewingDoc.type === 'pdf' ? (
                <iframe
                  src={viewingDoc.path}
                  className="w-full h-full min-h-[60vh] rounded-lg"
                  title={viewingDoc.name}
                />
              ) : (
                <img
                  src={viewingDoc.path}
                  alt={viewingDoc.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
