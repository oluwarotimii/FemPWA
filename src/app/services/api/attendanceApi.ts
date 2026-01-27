import apiClient from './apiClient';

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  clock_in: string;
  clock_out: string | null;
  status: string;
  hours_worked?: number;
}

interface AttendanceRequest {
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
}

export const attendanceApi = {
  // Mark attendance (clock in/out)
  markAttendance: async (request: AttendanceRequest): Promise<{ success: boolean; message: string; data: { attendance: AttendanceRecord } }> => {
    const response = await apiClient.post('/attendance', request);
    return response.data;
  },

  // Get attendance records for the authenticated user
  getAttendance: async (params?: { startDate?: string; endDate?: string; limit?: number; page?: number }): Promise<{ 
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
    const response = await apiClient.get('/attendance', { params });
    return response.data;
  },

  // Get shift timing information for the authenticated user
  getShiftTimings: async (): Promise<{ success: boolean; message: string; data: { shiftTimings: ShiftTiming[] } }> => {
    const response = await apiClient.get('/attendance/shift-timings');
    return response.data;
  },

  // Get holiday information
  getHolidays: async (params?: { branchId?: number; date?: string; startDate?: string; endDate?: string }): Promise<{ 
    success: boolean; 
    message: string; 
    data: { holidays: Holiday[] } 
  }> => {
    const response = await apiClient.get('/attendance/holidays', { params });
    return response.data;
  },
};