import apiClient from './apiClient';

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

interface UpdateStaffRequest {
  phone?: string;
  address?: string;
  emergency_contact?: string;
}

export const staffApi = {
  // Get staff profile information
  getStaffProfile: async (id: number): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },

  // Update staff profile information
  updateStaffProfile: async (id: number, request: UpdateStaffRequest): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const response = await apiClient.put(`/staff/${id}`, request);
    return response.data;
  },
};