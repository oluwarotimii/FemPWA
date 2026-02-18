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
  phone?: string;
  address?: string;
  emergency_contact?: string;
}

export const staffApi = {
  // Get current user's staff details
  getCurrentUserStaffDetails: async (): Promise<any> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/staff/profile');
    return response.data;
  },

  // Get staff profile information
  getStaffProfile: async (id: number): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },



  // Update staff profile information
  updateStaffProfile: async (id: number, request: UpdateStaffRequest): Promise<{ success: boolean; message: string; data: { staff: Staff } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.put(`/staff/${id}`, request);
    return response.data;
  },
};