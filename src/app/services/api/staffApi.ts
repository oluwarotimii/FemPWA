import apiClient from './apiClient';

interface StaffProfile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  branch?: string;
  date_joined?: string;
  status: string;
  profile_picture?: string;
}

interface UpdateProfileRequest {
  phone?: string;
  address?: string;
  emergency_contact?: string;
}

export const staffApi = {
  // Get staff profile information
  getProfile: async (id: number): Promise<{ success: boolean; message: string; data: { staff: StaffProfile } }> => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },

  // Update staff profile information
  updateProfile: async (id: number, request: UpdateProfileRequest): Promise<{ 
    success: boolean; 
    message: string; 
    data: { staff: StaffProfile } 
  }> => {
    const response = await apiClient.put(`/staff/${id}`, request);
    return response.data;
  },
};