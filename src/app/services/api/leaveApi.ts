import apiClient from './apiClient';

// ==================== INTERFACES ====================

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
  user_id: number;
  user_name?: string;
  leave_type_id: number;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  attachments?: string[];
  submitted_at: string;
  updated_at?: string;
}

export interface LeaveRequestInput {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  attachments?: string[];
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
  updated_at?: string;
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

export interface LeaveHistoryFilter {
  userId?: number;
  year?: number;
  status?: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// ==================== API FUNCTIONS ====================

export const leaveApi = {
  // ==================== LEAVE TYPES ====================

  /**
   * Get all active leave types
   * GET /leave/types
   */
  getLeaveTypes: async (): Promise<{
    success: boolean;
    message: string;
    data: { leaveTypes: LeaveType[] };
  }> => {
    const response = await apiClient.get('/leave/types');
    return response.data;
  },

  /**
   * Get a specific leave type by ID
   * GET /leave/types/:id
   */
  getLeaveTypeById: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { leaveType: LeaveType };
  }> => {
    const response = await apiClient.get(`/leave/types/${id}`);
    return response.data;
  },

  /**
   * Create a new leave type (Admin only)
   * POST /leave/types
   */
  createLeaveType: async (leaveType: Partial<LeaveType>): Promise<{
    success: boolean;
    message: string;
    data: { leaveType: LeaveType };
  }> => {
    const response = await apiClient.post('/leave/types', leaveType);
    return response.data;
  },

  /**
   * Update an existing leave type (Admin only)
   * PUT /leave/types/:id
   */
  updateLeaveType: async (
    id: number,
    updates: Partial<LeaveType>
  ): Promise<{
    success: boolean;
    message: string;
    data: { leaveType: LeaveType };
  }> => {
    const response = await apiClient.put(`/leave/types/${id}`, updates);
    return response.data;
  },

  /**
   * Deactivate a leave type (Admin only)
   * DELETE /leave/types/:id
   */
  deleteLeaveType: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/leave/types/${id}`);
    return response.data;
  },

  // ==================== LEAVE REQUESTS ====================

  /**
   * Get all leave requests with optional filters (Admin only)
   * GET /leave/requests?status=&page=&limit=
   */
  getAllLeaveRequests: async (params?: {
    status?: 'submitted' | 'approved' | 'rejected' | 'cancelled';
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      leaveRequests: LeaveRequest[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/leave/requests', { params });
    return response.data;
  },

  /**
   * Get current user's own leave requests
   * GET /leave/my-requests
   * Fallback: GET /leave/requests (if /my-requests endpoint is not available)
   */
  getMyLeaveRequests: async (params?: {
    status?: 'submitted' | 'approved' | 'rejected' | 'cancelled';
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      leaveRequests: LeaveRequest[];
      pagination: PaginationResponse;
    };
  }> => {
    try {
      // Try the correct /my-requests endpoint first
      const response = await apiClient.get('/leave/my-requests', { params });
      return response.data;
    } catch (error: any) {
      // If /my-requests endpoint doesn't exist (404), try fallbacks
      if (error.response?.status === 404) {
        console.log('Endpoint /leave/my-requests not found, trying /leave/requests/my');
        try {
          const response = await apiClient.get('/leave/requests/my', { params });
          return response.data;
        } catch (secondError: any) {
          if (secondError.response?.status === 404) {
            console.log('Endpoint /leave/requests/my not found, trying /leave/requests');
            const response = await apiClient.get('/leave/requests', { params });
            return response.data;
          }
          throw secondError;
        }
      }
      throw error;
    }
  },

  /**
   * Get a specific leave request by ID
   * GET /leave/requests/:id
   */
  getLeaveRequestById: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { leaveRequest: LeaveRequest };
  }> => {
    const response = await apiClient.get(`/leave/requests/${id}`);
    return response.data;
  },

  /**
   * Create a new leave request
   * POST /leave/requests
   */
  submitLeaveRequest: async (request: LeaveRequestInput): Promise<{
    success: boolean;
    message: string;
    data: { leaveRequest: LeaveRequest };
  }> => {
    const response = await apiClient.post('/leave/requests', request);
    return response.data;
  },

  /**
   * Update a leave request - primarily for status changes (Admin only)
   * PUT /leave/requests/:id
   */
  updateLeaveRequest: async (
    id: number,
    status: 'submitted' | 'approved' | 'rejected' | 'cancelled',
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: { leaveRequest: LeaveRequest };
  }> => {
    const response = await apiClient.put(`/leave/requests/${id}`, { status, reason });
    return response.data;
  },

  /**
   * Cancel a leave request (Admin only)
   * DELETE /leave/requests/:id
   */
  cancelLeaveRequest: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/leave/requests/${id}`);
    return response.data;
  },

  // ==================== LEAVE BALANCES ====================

  /**
   * Get current user's leave balance by leave type
   * GET /leave/balance
   */
  getLeaveBalances: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      balances: LeaveBalance[];
    };
  }> => {
    const response = await apiClient.get('/leave/balance');
    return response.data;
  },

  // ==================== LEAVE ALLOCATIONS ====================

  /**
   * Get all leave allocations with optional filters (Admin only)
   * GET /leave/allocations
   */
  getAllAllocations: async (params?: {
    userId?: number;
    leaveTypeId?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      leaveAllocations: LeaveAllocation[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/leave/allocations', { params });
    return response.data;
  },

  /**
   * Get current user's own leave allocations
   * GET /leave/allocations/my-allocations
   */
  getMyAllocations: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      allocations: LeaveAllocation[];
    };
  }> => {
    const response = await apiClient.get('/leave/allocations/my-allocations');
    return response.data;
  },

  /**
   * Get a specific leave allocation by ID
   * GET /leave/allocations/:id
   */
  getAllocationById: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { leaveAllocation: LeaveAllocation };
  }> => {
    const response = await apiClient.get(`/leave/allocations/${id}`);
    return response.data;
  },

  /**
   * Create a single leave allocation (Admin only)
   * POST /leave/allocations
   */
  createAllocation: async (allocation: CreateLeaveAllocationInput): Promise<{
    success: boolean;
    message: string;
    data: { leaveAllocation: LeaveAllocation };
  }> => {
    const response = await apiClient.post('/leave/allocations', allocation);
    return response.data;
  },

  /**
   * Bulk allocate leave to selected users (Admin only)
   * POST /leave/allocations/bulk
   */
  bulkAllocate: async (data: {
    leave_type_id: number;
    allocated_days: number;
    cycle_start_date: string;
    cycle_end_date: string;
    carried_over_days?: number;
    user_ids: number[];
  }): Promise<{
    success: boolean;
    message: string;
    data: { allocations: LeaveAllocation[] };
  }> => {
    const response = await apiClient.post('/leave/allocations/bulk', data);
    return response.data;
  },

  /**
   * Bulk allocate leave to ALL active users (Admin only)
   * POST /leave/allocations/allocate-all
   */
  allocateToAllUsers: async (data: {
    leave_type_id: number;
    allocated_days: number;
    cycle_start_date: string;
    cycle_end_date: string;
    carried_over_days?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: { allocations: LeaveAllocation[] };
  }> => {
    const response = await apiClient.post('/leave/allocations/allocate-all', data);
    return response.data;
  },

  /**
   * Update an existing leave allocation (Admin only)
   * PUT /leave/allocations/:id
   */
  updateAllocation: async (
    id: number,
    updates: UpdateLeaveAllocationInput
  ): Promise<{
    success: boolean;
    message: string;
    data: { leaveAllocation: LeaveAllocation };
  }> => {
    const response = await apiClient.put(`/leave/allocations/${id}`, updates);
    return response.data;
  },

  /**
   * Delete a leave allocation (Admin only)
   * DELETE /leave/allocations/:id
   */
  deleteAllocation: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/leave/allocations/${id}`);
    return response.data;
  },

  // ==================== LEAVE HISTORY ====================

  /**
   * Get leave history from leave_history table
   * GET /leave/history
   */
  getLeaveHistory: async (params?: LeaveHistoryFilter): Promise<{
    success: boolean;
    message: string;
    data: {
      history: LeaveRequest[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/leave/history', { params });
    return response.data;
  },
};
