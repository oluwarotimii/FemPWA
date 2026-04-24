import { useState, useEffect } from 'react';
import { X, Save, Upload, Download, Trash2, CheckCircle, AlertCircle, User, Phone, Mail, MapPin, Briefcase, FileText, Shield, Calendar } from 'lucide-react';
import { guarantorApi, Guarantor, GuarantorInput } from '../../services/api/guarantorApi';

interface GuarantorFormProps {
  staffId: number;
  onClose: () => void;
  onSuccess: () => void;
}

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
  { value: 'female', label: 'Female' }
];

const guaranteeTypeOptions = [
  { value: 'personal', label: 'Personal Guarantee' },
  { value: 'financial', label: 'Financial Guarantee' },
  { value: 'both', label: 'Both Personal & Financial' }
];

const relationshipOptions = [
  'Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Colleague', 'Other'
];

export function GuarantorForm({ staffId, onClose, onSuccess }: GuarantorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingForm, setUploadingForm] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [selectedGuarantor, setSelectedGuarantor] = useState<Guarantor | null>(null);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [showList, setShowList] = useState(true);

  const emptyGuarantor: GuarantorInput = {
    staff_id: staffId,
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    gender: undefined,
    phone_number: '',
    alternate_phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Nigeria',
    id_type: undefined,
    id_number: '',
    id_issuing_authority: '',
    id_issue_date: '',
    id_expiry_date: '',
    relationship: '',
    occupation: '',
    employer_name: '',
    employer_address: '',
    // Removed employer_phone - not in database schema
    guarantee_type: 'personal',
    guarantee_amount: undefined,
    // Removed guarantee_start_date and guarantee_end_date - optional fields not in main form
    guarantee_terms: '',
    is_active: true
  };

  const [formData, setFormData] = useState<GuarantorInput>(emptyGuarantor);

  useEffect(() => {
    loadGuarantors();
  }, [staffId]);

  const loadGuarantors = async () => {
    try {
      const response = await guarantorApi.getGuarantors(staffId);
      if (response.success) {
        setGuarantors(response.data.guarantors);
      }
    } catch (err: any) {
      console.error('Error loading guarantors:', err);
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
          setSuccessMessage('Guarantor updated successfully');
          resetForm();
          loadGuarantors();
          onSuccess();
        }
      } else {
        // Create new
        const response = await guarantorApi.createGuarantor(formData);
        if (response.success) {
          setSuccessMessage('Guarantor created successfully');
          resetForm();
          loadGuarantors();
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save guarantor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyGuarantor);
    setSelectedGuarantor(null);
    setShowList(true);
  };

  const handleEdit = (guarantor: Guarantor) => {
    setFormData({
      ...guarantor,
      date_of_birth: guarantor.date_of_birth ? guarantor.date_of_birth.split('T')[0] : '',
      id_issue_date: guarantor.id_issue_date ? guarantor.id_issue_date.split('T')[0] : '',
      id_expiry_date: guarantor.id_expiry_date ? guarantor.id_expiry_date.split('T')[0] : ''
      // Removed guarantee_start_date and guarantee_end_date
    });
    setSelectedGuarantor(guarantor);
    setShowList(false);
  };

  const handleDelete = async (guarantorId: number, guarantorName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${guarantorName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await guarantorApi.deleteGuarantor(guarantorId);
      if (response.success) {
        setSuccessMessage('Guarantor deleted successfully');
        loadGuarantors();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete guarantor');
    }
  };

  const handleVerify = async (guarantorId: number) => {
    const notes = prompt('Enter verification notes (optional):');
    try {
      const response = await guarantorApi.verifyGuarantor(guarantorId, notes || undefined);
      if (response.success) {
        setSuccessMessage('Guarantor verified successfully');
        loadGuarantors();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify guarantor');
    }
  };

  const handleUploadDocument = async (guarantorId: number, documentType: 'form' | 'id', file: File) => {
    try {
      if (documentType === 'form') {
        setUploadingForm(true);
      } else {
        setUploadingId(true);
      }

      const response = await guarantorApi.uploadDocument(guarantorId, documentType, file);
      if (response.success) {
        setSuccessMessage('Document uploaded successfully');
        loadGuarantors();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      if (documentType === 'form') {
        setUploadingForm(false);
      } else {
        setUploadingId(false);
      }
    }
  };

  const handleInputChange = (field: keyof GuarantorInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    required = false,
    icon: Icon
  }: { 
    label: string; 
    field: keyof GuarantorInput; 
    type?: string; 
    required?: boolean;
    icon?: any;
  }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          rows={3}
          required={required}
        />
      ) : type === 'select' ? (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={required}
        >
          <option value="">Select {label}</option>
          {field === 'gender' && genderOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {field === 'id_type' && idTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {field === 'guarantee_type' && guaranteeTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {field === 'state' && nigerianStates.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
          {field === 'relationship' && relationshipOptions.map(rel => (
            <option key={rel} value={rel}>{rel}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={required}
        />
      )}
    </div>
  );

  if (showList) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Guarantors</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowList(false);
                }}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 600
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Add New Guarantor
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {guarantors.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No guarantors added yet</p>
                <p className="text-gray-400 text-sm mt-2">Click "Add New Guarantor" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {guarantors.map(guarantor => (
                  <div
                    key={guarantor.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {guarantor.first_name} {guarantor.middle_name} {guarantor.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{guarantor.relationship} • {guarantor.occupation}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {guarantor.is_verified ? (
                          <span className="badge badge-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="badge badge-secondary flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                        <span className={`badge ${guarantor.is_active ? 'badge-success' : 'badge-secondary'}`}>
                          {guarantor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{guarantor.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{guarantor.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{guarantor.city}, {guarantor.state}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(guarantor)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      {!guarantor.is_verified && (
                        <button
                          onClick={() => handleVerify(guarantor.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Verify
                        </button>
                      )}
                      <label className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
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
                          disabled={uploadingForm}
                        />
                      </label>
                      <label className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
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
                          disabled={uploadingId}
                        />
                      </label>
                      {guarantor.guarantor_form_path && (
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL || 'https://hrapi.femtechaccess.com.ng/api'}${guarantor.guarantor_form_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          View Form
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(guarantor.id, `${guarantor.first_name} ${guarantor.last_name}`)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedGuarantor ? 'Edit Guarantor' : 'Add New Guarantor'}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={resetForm}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Back to List
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="First Name" field="first_name" required icon={User} />
                <InputField label="Middle Name" field="middle_name" />
                <InputField label="Last Name" field="last_name" required icon={User} />
                <InputField label="Date of Birth" field="date_of_birth" type="date" icon={Calendar} />
                <InputField label="Gender" field="gender" type="select" icon={User} />
                <InputField label="Phone Number" field="phone_number" type="tel" required icon={Phone} />
                <InputField label="Alternate Phone" field="alternate_phone" type="tel" icon={Phone} />
                <InputField label="Email" field="email" type="email" icon={Mail} />
                <InputField label="Relationship" field="relationship" type="select" icon={User} />
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Address Line 1" field="address_line_1" required icon={MapPin} />
                <InputField label="Address Line 2" field="address_line_2" />
                <InputField label="City" field="city" icon={MapPin} />
                <InputField label="State" field="state" type="select" icon={MapPin} />
                <InputField label="Postal Code" field="postal_code" icon={MapPin} />
                <InputField label="Country" field="country" icon={MapPin} />
              </div>
            </div>

            {/* Identification */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Identification Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="ID Type" field="id_type" type="select" icon={Shield} />
                <InputField label="ID Number" field="id_number" icon={Shield} />
                <InputField label="Issuing Authority" field="id_issuing_authority" icon={Shield} />
                <InputField label="Issue Date" field="id_issue_date" type="date" icon={Calendar} />
                <InputField label="Expiry Date" field="id_expiry_date" type="date" icon={Calendar} />
              </div>
            </div>

            {/* Employment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Employment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Occupation" field="occupation" icon={Briefcase} />
                <InputField label="Employer Name" field="employer_name" icon={Briefcase} />
                <InputField label="Employer Address" field="employer_address" icon={MapPin} />
                {/* Removed employer_phone - not in database schema */}
              </div>
            </div>

            {/* Guarantee Details - Optional */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Guarantee Details (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Guarantee Type" field="guarantee_type" type="select" icon={FileText} />
                <InputField label="Guarantee Amount (₦)" field="guarantee_amount" type="number" icon={FileText} />
                <div className="md:col-span-3">
                  <InputField label="Terms & Conditions" field="guarantee_terms" type="textarea" icon={FileText} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 600
              }}
            >
              {loading ? 'Saving...' : (selectedGuarantor ? 'Update' : 'Create')} Guarantor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
