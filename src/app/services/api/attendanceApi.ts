import apiClient from './apiClient';

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  location_coordinates?: { x: number; y: number } | null;
  location_verified?: number;
  location_address?: string | null;
  hours_worked?: number;
  is_auto_checkout?: boolean;
}

interface ClockInOutRequest {
  status: 'clock_in' | 'clock_out';
}

interface ShiftTiming {
  id: number;
  user_id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to: string;
}

interface Holiday {
  id: number;
  holiday_name: string;
  date: string;
  branch_id: number;
  is_mandatory: boolean;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface ShiftTemplate {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  recurrence_pattern: string;
  recurrence_days: string[];
}

interface EmployeeShiftAssignment {
  id: number;
  user_id: number;
  shift_template_id: number;
  effective_from: string;
  effective_to: string;
  notes: string;
  created_at: string;
}

interface ScheduleRequest {
  request_type: string;
  request_subtype: string;
  requested_date: string;
  requested_duration_days: number;
  reason: string;
  scheduled_for: string;
}

interface TimeOffBank {
  id: number;
  user_id: number;
  program_name: string;
  description: string;
  total_entitled_days: number;
  used_days: number;
  remaining_days: number;
  valid_from: string;
  valid_to: string;
}

export const attendanceApi = {
  // Mark attendance (clock in/out)
  clockInOut: async (request: ClockInOutRequest): Promise<{ success: boolean; message: string; data: { attendance: AttendanceRecord } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.post('/attendance', request);
    return response.data;
  },

  // Get all attendance records for the authenticated user
  getMyAttendance: async (params?: { startDate?: string; endDate?: string; limit?: number; page?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      attendance: AttendanceRecord[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }
  }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/attendance/my', { params });
    return response.data;
  },

  // Get attendance summary for the authenticated user
  getMyAttendanceSummary: async (params?: { startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    message: string;
    data: {
      summary: {
        totalDays: number;
        presentDays: number;
        lateDays: number;
        absentDays: number;
        onTimeDays: number;
        totalHoursWorked: number;
        averageHoursPerDay: number;
      };
    };
  }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/attendance/my/summary', { params });
    return response.data;
  },

  // Get shift timing information for the authenticated user
  getShiftTimings: async (): Promise<{ success: boolean; message: string; data: { shiftTimings: ShiftTiming[] } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/attendance/shift-timings');
    return response.data;
  },

  // Get holiday information
  getHolidays: async (params?: { branchId?: number; date?: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    message: string;
    data: { holidays: Holiday[] }
  }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/attendance/holidays', { params });
    return response.data;
  },

  // Get shift templates
  getShiftTemplates: async (): Promise<{ success: boolean; message: string; data: { shiftTemplates: ShiftTemplate[] } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/shift-scheduling/shift-templates');
    return response.data;
  },

  // Get employee shift assignments
  getEmployeeShiftAssignments: async (): Promise<{ success: boolean; message: string; data: { employeeShiftAssignments: EmployeeShiftAssignment[] } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/shift-scheduling/employee-shift-assignments');
    return response.data;
  },

  // Submit a schedule request
  submitScheduleRequest: async (request: ScheduleRequest): Promise<{ success: boolean; message: string; data: { scheduleRequest: ScheduleRequest } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.post('/shift-scheduling/schedule-requests', request);
    return response.data;
  },

  // Clock in
  checkIn: async (request: Partial<AttendanceRecord>): Promise<{ success: boolean; message: string; data: { attendance: AttendanceRecord } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.post('/attendance/check-in', request);
    return response.data;
  },

  // Clock out
  checkOut: async (request: Partial<AttendanceRecord> & { is_auto_checkout?: boolean }): Promise<{ success: boolean; message: string; data: { attendance: AttendanceRecord } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.post('/attendance/check-out', request);
    return response.data;
  },

  // Get time off bank balance
  getTimeOffBankBalance: async (): Promise<{ success: boolean; message: string; data: { timeOffBanks: TimeOffBank[] } }> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await apiClient.get('/shift-scheduling/time-off-banks/my-balance');
    return response.data;
  },
};