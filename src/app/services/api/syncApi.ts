import apiClient from './apiClient';

export const syncApi = {
  getDashboardData: async (): Promise<{
    success: boolean;
    data: {
      branchInfo: any;
      assignedLocations: any[];
      todayAttendance: any;
      monthAttendance: any[];
      todaySchedule: any;
      shiftExceptions: any[];
      serverTime: string;
    };
  }> => {
    const response = await apiClient.get('/sync/dashboard-data');
    return response.data;
  },

  getAttendanceChanges: async (since: string): Promise<{
    success: boolean;
    data: {
      attendance: any[];
      serverTime: string;
    };
  }> => {
    const response = await apiClient.get('/sync/attendance-changes', { params: { since } });
    return response.data;
  },

  getFullSync: async (clientTimestamp?: string): Promise<{
    success: boolean;
    data: {
      serverTime: string;
      user: any;
      staff: any;
      permissions: string[];
      branchInfo: any;
      branchWorkingDays: any[];
      assignedLocations: any[];
      attendance: any[];
      todayShift: any;
      shiftExceptions: any[];
      holidays: any[];
      leaveBalance: any[];
      departments: any[];
      branches: any[];
      attendanceSettings: any;
    };
  }> => {
    const params: any = {};
    if (clientTimestamp) params.clientTimestamp = clientTimestamp;
    const response = await apiClient.get('/sync/full', { params });
    return response.data;
  },
};
