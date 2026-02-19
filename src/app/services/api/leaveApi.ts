import apiClient from './apiClient';

export interface LeaveType {
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

export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_requested: number;
  submitted_at: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  attachments?: string[];
}

export interface LeaveRequestInput {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  attachments?: string[];
}

export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
}

export const leaveApi = {
  // Get all available leave types
  getLeaveTypes: async (): Promise<{ success: boolean; message: string; data: { leaveTypes: LeaveType[] } }> => {
    const response = await apiClient.get('/leave/types');
    return response.data;
  },

  // Get leave type by ID
  getLeaveTypeById: async (id: number): Promise<{ success: boolean; message: string; data: { leaveType: LeaveType } }> => {
    const response = await apiClient.get(`/leave/types/${id}`);
    return response.data;
  },

  // Get leave requests for the authenticated user
  getMyLeaveRequests: async (params?: { status?: string; limit?: number; page?: number }): Promise<{
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
    const response = await apiClient.get('/leave/my-requests', { params });
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

  // Get leave request by ID
  getLeaveRequestById: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { leaveRequest: LeaveRequest }
  }> => {
    const response = await apiClient.get(`/leave/${id}`);
    return response.data;
  },

  // Cancel a leave request
  cancelLeaveRequest: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/leave/${id}/cancel`);
    return response.data;
  },

  // Get user's leave balances
  getLeaveBalances: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      balances: LeaveBalance[];
    }
  }> => {
    const response = await apiClient.get('/leave/balances');
    return response.data;
  },
};