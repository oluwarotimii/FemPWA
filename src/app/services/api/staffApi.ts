import apiClient from './apiClient';
import axios from 'axios';

interface Staff {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  branch: string;
  date_joined: string;
  status: string;
  profile_picture?: string;
}

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

interface UpdateStaffRequest {
  phone_number?: string;
  current_address?: string;
  emergency_contact_phone?: string;
  date_of_birth?: string;
  gender?: string;
}

export const staffApi = {
  // Get current user's staff details
  getCurrentUserStaffDetails: async (): Promise<any> => {
    const response = await apiClient.get('/staff/me');
    return response.data;
  },

  // Get staff profile information
  getStaffProfile: async (id: number): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },

  // Get all staff (Admin only)
  getAllStaff: async (params?: {
    branchId?: number;
    status?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      staff: Staff[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    };
  }> => {
    const response = await apiClient.get('/staff/', { params });
    return response.data;
  },

  // Update staff profile information
  updateStaffProfile: async (userId: number, request: UpdateStaffRequest): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const response = await apiClient.put(`/staff/${userId}`, request);
    return response.data;
  },

  // Create staff profile (for new users filling personal details)
  createStaffProfile: async (data: any): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const response = await apiClient.post('/staff', data);
    return response.data;
  },

  // Get own documents (includes CV)
  getOwnDocuments: async (): Promise<any> => {
    const response = await apiClient.get('/staff-documents/me/documents');
    return response.data;
  },

  // Upload own CV
  uploadCV: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('document_type', 'Resume/CV');
    const response = await apiClient.post('/staff-documents/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload any document with custom type
  uploadDocument: async (file: File, documentType: string): Promise<any> => {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('document_type', documentType);
    const response = await apiClient.post('/staff-documents/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete own document
  deleteOwnDocument: async (documentId: number): Promise<any> => {
    const response = await apiClient.delete(`/staff-documents/me/documents/${documentId}`);
    return response.data;
  },
};
