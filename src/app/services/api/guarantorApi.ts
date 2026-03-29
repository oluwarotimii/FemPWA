import apiClient from './apiClient';

export interface Guarantor {
  id: number;
  staff_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  id_type?: 'national_id' | 'passport' | 'drivers_license' | 'voters_card' | 'other';
  id_number?: string;
  id_issuing_authority?: string;
  id_issue_date?: string;
  id_expiry_date?: string;
  relationship?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  employer_phone?: string;
  guarantee_type?: 'personal' | 'financial' | 'both';
  guarantee_amount?: number;
  guarantee_start_date?: string;
  guarantee_end_date?: string;
  guarantee_terms?: string;
  guarantor_form_path?: string;
  id_document_path?: string;
  is_verified: boolean;
  verified_by?: number;
  verified_at?: string;
  verification_notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuarantorInput {
  staff_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  id_type?: 'national_id' | 'passport' | 'drivers_license' | 'voters_card' | 'other';
  id_number?: string;
  id_issuing_authority?: string;
  id_issue_date?: string;
  id_expiry_date?: string;
  relationship?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  employer_phone?: string;
  guarantee_type?: 'personal' | 'financial' | 'both';
  guarantee_amount?: number;
  guarantee_start_date?: string;
  guarantee_end_date?: string;
  guarantee_terms?: string;
  is_active?: boolean;
}

export const guarantorApi = {
  // Get all guarantors for a staff member
  getGuarantors: async (staffId: number): Promise<any> => {
    const response = await apiClient.get(`/guarantors/staff/${staffId}`);
    return response.data;
  },

  // Get specific guarantor
  getGuarantor: async (guarantorId: number): Promise<any> => {
    const response = await apiClient.get(`/guarantors/${guarantorId}`);
    return response.data;
  },

  // Create new guarantor
  createGuarantor: async (data: GuarantorInput): Promise<any> => {
    const response = await apiClient.post('/guarantors', data);
    return response.data;
  },

  // Update guarantor
  updateGuarantor: async (guarantorId: number, data: Partial<GuarantorInput>): Promise<any> => {
    const response = await apiClient.put(`/guarantors/${guarantorId}`, data);
    return response.data;
  },

  // Delete guarantor
  deleteGuarantor: async (guarantorId: number): Promise<any> => {
    const response = await apiClient.delete(`/guarantors/${guarantorId}`);
    return response.data;
  },

  // Verify guarantor (admin only)
  verifyGuarantor: async (guarantorId: number, verificationNotes?: string): Promise<any> => {
    const response = await apiClient.post(`/guarantors/${guarantorId}/verify`, {
      verification_notes: verificationNotes
    });
    return response.data;
  },

  // Upload guarantor document (form or ID)
  uploadDocument: async (guarantorId: number, documentType: 'form' | 'id', file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await apiClient.post(
      `/guarantors/${guarantorId}/upload/${documentType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }
};
