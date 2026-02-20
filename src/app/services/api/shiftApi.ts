import apiClient from './apiClient';

// ==================== INTERFACES ====================

export interface ShiftTemplate {
  id: number;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  effective_from?: string;
  effective_to?: string;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeShiftAssignment {
  id: number;
  user_id: number;
  user_name?: string;
  shift_template_id: number;
  shift_template_name?: string;
  custom_start_time?: string;
  custom_end_time?: string;
  custom_break_duration_minutes?: number;
  effective_from: string;
  effective_to?: string;
  assignment_type: 'permanent' | 'temporary' | 'rotating';
  status: 'pending' | 'approved' | 'active' | 'expired' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftTiming {
  id: number;
  user_id?: number;
  user_name?: string;
  override_branch_id?: number;
  branch_name?: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleRequest {
  id: number;
  user_id: number;
  user_name?: string;
  request_type: 'time_off_request' | 'schedule_change' | 'shift_swap' | 'flexible_arrangement' | 'compensatory_time_use';
  requested_date?: string;
  requested_start_time?: string;
  requested_end_time?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  scheduled_for?: string;
  expires_on?: string;
  submitted_at: string;
  updated_at?: string;
}

export interface TimeOffBank {
  id: number;
  user_id: number;
  user_name?: string;
  balance_hours: number;
  allocated_hours: number;
  used_hours: number;
  cycle_start_date: string;
  cycle_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftTemplateInput {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  break_duration_minutes?: number;
  effective_from?: string;
  effective_to?: string;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: string[];
  is_active?: boolean;
}

export interface CreateShiftAssignmentInput {
  user_id: number;
  shift_template_id: number;
  custom_start_time?: string;
  custom_end_time?: string;
  custom_break_duration_minutes?: number;
  effective_from: string;
  effective_to?: string;
  assignment_type?: 'permanent' | 'temporary' | 'rotating';
  notes?: string;
}

export interface CreateShiftTimingInput {
  user_id?: number;
  override_branch_id?: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to?: string;
}

export interface CreateScheduleRequestInput {
  request_type: 'time_off_request' | 'schedule_change' | 'shift_swap' | 'flexible_arrangement' | 'compensatory_time_use';
  requested_date?: string;
  requested_start_time?: string;
  requested_end_time?: string;
  reason: string;
  scheduled_for?: string;
  expires_on?: string;
}

export interface PaginationResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// ==================== API FUNCTIONS ====================

export const shiftApi = {
  // ==================== SHIFT TEMPLATES ====================

  /**
   * Get all shift templates
   * GET /shift-scheduling/shift-templates
   */
  getShiftTemplates: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      shiftTemplates: ShiftTemplate[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/shift-scheduling/shift-templates', { params });
    return response.data;
  },

  /**
   * Get shift template by ID
   * GET /shift-scheduling/shift-templates/:id
   */
  getShiftTemplateById: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { shiftTemplate: ShiftTemplate };
  }> => {
    const response = await apiClient.get(`/shift-scheduling/shift-templates/${id}`);
    return response.data;
  },

  /**
   * Create shift template (Admin only)
   * POST /shift-scheduling/shift-templates
   */
  createShiftTemplate: async (template: CreateShiftTemplateInput): Promise<{
    success: boolean;
    message: string;
    data: { shiftTemplate: ShiftTemplate };
  }> => {
    const response = await apiClient.post('/shift-scheduling/shift-templates', template);
    return response.data;
  },

  /**
   * Update shift template (Admin only)
   * PUT /shift-scheduling/shift-templates/:id
   */
  updateShiftTemplate: async (
    id: number,
    updates: Partial<CreateShiftTemplateInput>
  ): Promise<{
    success: boolean;
    message: string;
    data: { shiftTemplate: ShiftTemplate };
  }> => {
    const response = await apiClient.put(`/shift-scheduling/shift-templates/${id}`, updates);
    return response.data;
  },

  /**
   * Delete shift template (Admin only)
   * DELETE /shift-scheduling/shift-templates/:id
   */
  deleteShiftTemplate: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/shift-scheduling/shift-templates/${id}`);
    return response.data;
  },

  // ==================== EMPLOYEE SHIFT ASSIGNMENTS ====================

  /**
   * Get all shift assignments (Admin only)
   * GET /shift-scheduling/employee-shift-assignments
   */
  getShiftAssignments: async (params?: {
    userId?: number;
    status?: 'pending' | 'approved' | 'active' | 'expired' | 'cancelled';
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      shiftAssignments: EmployeeShiftAssignment[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/shift-scheduling/employee-shift-assignments', { params });
    return response.data;
  },

  /**
   * Get my shift assignments
   * GET /shift-scheduling/employee-shift-assignments/my
   */
  getMyShiftAssignments: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      shiftAssignments: EmployeeShiftAssignment[];
    };
  }> => {
    const response = await apiClient.get('/shift-scheduling/employee-shift-assignments/my');
    return response.data;
  },

  /**
   * Assign shift to employee (Admin only)
   * POST /shift-scheduling/employee-shift-assignments
   */
  assignShift: async (assignment: CreateShiftAssignmentInput): Promise<{
    success: boolean;
    message: string;
    data: { shiftAssignment: EmployeeShiftAssignment };
  }> => {
    const response = await apiClient.post('/shift-scheduling/employee-shift-assignments', assignment);
    return response.data;
  },

  /**
   * Bulk assign shifts (Admin only)
   * POST /shift-scheduling/employee-shift-assignments/bulk
   */
  bulkAssignShifts: async (assignments: {
    assignments: CreateShiftAssignmentInput[];
  }): Promise<{
    success: boolean;
    message: string;
    data: { shiftAssignments: EmployeeShiftAssignment[] };
  }> => {
    const response = await apiClient.post('/shift-scheduling/employee-shift-assignments/bulk', assignments);
    return response.data;
  },

  /**
   * Update shift assignment (Admin only)
   * PUT /shift-scheduling/employee-shift-assignments/:id
   */
  updateShiftAssignment: async (
    id: number,
    updates: Partial<CreateShiftAssignmentInput> & { status?: string }
  ): Promise<{
    success: boolean;
    message: string;
    data: { shiftAssignment: EmployeeShiftAssignment };
  }> => {
    const response = await apiClient.put(`/shift-scheduling/employee-shift-assignments/${id}`, updates);
    return response.data;
  },

  // ==================== SHIFT TIMINGS ====================

  /**
   * Get all shift timings (Admin only)
   * GET /shift-timings
   */
  getShiftTimings: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      shiftTimings: ShiftTiming[];
    };
  }> => {
    const response = await apiClient.get('/shift-timings');
    return response.data;
  },

  /**
   * Create shift timing (Admin only)
   * POST /shift-timings
   */
  createShiftTiming: async (timing: CreateShiftTimingInput): Promise<{
    success: boolean;
    message: string;
    data: { shiftTiming: ShiftTiming };
  }> => {
    const response = await apiClient.post('/shift-timings', timing);
    return response.data;
  },

  /**
   * Update shift timing (Admin only)
   * PUT /shift-timings/:id
   */
  updateShiftTiming: async (
    id: number,
    updates: Partial<CreateShiftTimingInput>
  ): Promise<{
    success: boolean;
    message: string;
    data: { shiftTiming: ShiftTiming };
  }> => {
    const response = await apiClient.put(`/shift-timings/${id}`, updates);
    return response.data;
  },

  /**
   * Delete shift timing (Admin only)
   * DELETE /shift-timings/:id
   */
  deleteShiftTiming: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/shift-timings/${id}`);
    return response.data;
  },

  // ==================== SCHEDULE REQUESTS ====================

  /**
   * Get all schedule requests (Admin only, or user's own requests)
   * GET /shift-scheduling/schedule-requests
   */
  getScheduleRequests: async (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      scheduleRequests: ScheduleRequest[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/shift-scheduling/schedule-requests', { params });
    return response.data;
  },

  /**
   * Get my schedule requests
   * GET /shift-scheduling/schedule-requests/my
   */
  getMyScheduleRequests: async (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      scheduleRequests: ScheduleRequest[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/shift-scheduling/schedule-requests/my', { params });
    return response.data;
  },

  /**
   * Create schedule request
   * POST /shift-scheduling/schedule-requests
   */
  createScheduleRequest: async (request: CreateScheduleRequestInput): Promise<{
    success: boolean;
    message: string;
    data: { scheduleRequest: ScheduleRequest };
  }> => {
    const response = await apiClient.post('/shift-scheduling/schedule-requests', request);
    return response.data;
  },

  /**
   * Approve schedule request (Admin only)
   * PUT /shift-scheduling/schedule-requests/:id/approve
   */
  approveScheduleRequest: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { scheduleRequest: ScheduleRequest };
  }> => {
    const response = await apiClient.put(`/shift-scheduling/schedule-requests/${id}/approve`);
    return response.data;
  },

  /**
   * Reject schedule request (Admin only)
   * PUT /shift-scheduling/schedule-requests/:id/reject
   */
  rejectScheduleRequest: async (id: number, reason?: string): Promise<{
    success: boolean;
    message: string;
    data: { scheduleRequest: ScheduleRequest };
  }> => {
    const response = await apiClient.put(`/shift-scheduling/schedule-requests/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Cancel schedule request (Requester only)
   * PUT /shift-scheduling/schedule-requests/:id/cancel
   */
  cancelScheduleRequest: async (id: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.put(`/shift-scheduling/schedule-requests/${id}/cancel`);
    return response.data;
  },

  // ==================== TIME OFF BANKS ====================

  /**
   * Get all time off banks (Admin only)
   * GET /time-off-banks
   */
  getTimeOffBanks: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      timeOffBanks: TimeOffBank[];
      pagination: PaginationResponse;
    };
  }> => {
    const response = await apiClient.get('/time-off-banks', { params });
    return response.data;
  },

  /**
   * Get my time off balance
   * GET /time-off-banks/my-balance
   */
  getMyTimeOffBalance: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      timeOffBank: TimeOffBank;
    };
  }> => {
    const response = await apiClient.get('/time-off-banks/my-balance');
    return response.data;
  },
};
