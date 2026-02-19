import apiClient from './apiClient';

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  days_per_year: number;
  is_paid: boolean;
  allow_carryover: boolean;
  carryover_limit: number;
  expiry_rule_id?: number;
  created_by?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  form_id: number;
  user_id: number;
  user_name: string;
  submission_data: {
    leave_type_id: number;
    leave_type_name?: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string;
    requested_by?: number;
  };
  status: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  submitted_at: string;
  notes?: string;
}

export interface LeaveRequestInput {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  remaining_days: number;
  cycle_start_date: string;
  cycle_end_date: string;
}

export interface LeaveAllocation {
  id: number;
  user_id: number;
  user_name?: string;
  leave_type_id: number;
  leave_type_name: string;
  cycle_start_date: string;
  cycle_end_date: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  remaining_days?: number;
  created_at: string;
}

export interface CreateLeaveAllocationInput {
  user_id: number;
  leave_type_id: number;
  allocated_days: number;
  cycle_start_date: string;
  cycle_end_date: string;
  carried_over_days?: number;
}

export interface UpdateLeaveAllocationInput {
  allocated_days?: number;
  used_days?: number;
  carried_over_days?: number;
}

export const leaveApi = {
  // ==================== LEAVE TYPES ====================
  
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

  // ==================== LEAVE REQUESTS ====================

  // Get leave requests for the authenticated user
  getMyLeaveRequests: async (params?: { status?: string; limit?: number; page?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      leaveRequests: LeaveRequest[];
      pagination: {
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

  // Get leave request by ID
  getLeaveRequestById: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { leaveRequest: LeaveRequest }
  }> => {
    const response = await apiClient.get(`/leave/${id}`);
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

  // Update leave request (approve/reject) - Admin only
  updateLeaveRequest: async (id: number, status: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    data: { leaveRequest: LeaveRequest }
  }> => {
    const response = await apiClient.put(`/leave/${id}`, { status, reason });
    return response.data;
  },

  // Cancel/delete leave request
  cancelLeaveRequest: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/leave/${id}`);
    return response.data;
  },

  // ==================== LEAVE BALANCES ====================

  // Get current user's leave balances
  getLeaveBalances: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      balances: LeaveBalance[];
    }
  }> => {
    const response = await apiClient.get('/leave/balance');
    return response.data;
  },

  // ==================== LEAVE ALLOCATIONS ====================

  // Get current user's allocations
  getMyAllocations: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      allocations: LeaveAllocation[];
    }
  }> => {
    const response = await apiClient.get('/leave/allocations/my-allocations');
    return response.data;
  },

  // Get all allocations (Admin only)
  getAllAllocations: async (params?: { userId?: number; leaveTypeId?: number; limit?: number; page?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      leaveAllocations: LeaveAllocation[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }
  }> => {
    const response = await apiClient.get('/leave/allocations', { params });
    return response.data;
  },

  // Create leave allocation (Admin only)
  createAllocation: async (allocation: CreateLeaveAllocationInput): Promise<{
    success: boolean;
    message: string;
    data: { leaveAllocation: LeaveAllocation }
  }> => {
    const response = await apiClient.post('/leave/allocations', allocation);
    return response.data;
  },

  // Update leave allocation (Admin only)
  updateAllocation: async (id: number, updates: UpdateLeaveAllocationInput): Promise<{
    success: boolean;
    message: string;
    data: { leaveAllocation: LeaveAllocation }
  }> => {
    const response = await apiClient.put(`/leave/allocations/${id}`, updates);
    return response.data;
  },

  // Delete leave allocation (Admin only)
  deleteAllocation: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/leave/allocations/${id}`);
    return response.data;
  },
};