import apiClient from './apiClient';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  days_per_year: number;
  is_paid: boolean;
  allow_carryover: boolean;
  carryover_limit: number;
  expiry_rule_id: number;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_requested: number;
  submitted_at: string;
}

interface LeaveRequestInput {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  attachments?: string[];
}

export const leaveApi = {
  // Get all available leave types
  getLeaveTypes: async (): Promise<{ success: boolean; message: string; data: { leaveTypes: LeaveType[] } }> => {
    const response = await apiClient.get('/leave/types');
    return response.data;
  },

  // Get leave requests for the authenticated user
  getLeaveRequests: async (params?: { status?: string; limit?: number; page?: number }): Promise<{ 
    success: boolean; 
    message: string; 
    data: { 
      leaveRequests: LeaveRequest[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    } 
  }> => {
    const response = await apiClient.get('/leave', { params });
    return response.data;
  },

  // Submit a new leave request
  submitLeaveRequest: async (request: LeaveRequestInput): Promise<{ 
    success: boolean; 
    message: string; 
    data: { leaveRequest: LeaveRequest } 
  }> => {
    const response = await apiClient.post('/leave', request);
    return response.data;
  },
};