import apiClient from './apiClient';

export interface Holiday {
  id: number;
  holiday_name: string;
  date: string;
  branch_id: number | null;
  is_mandatory: boolean;
  description: string | null;
  created_at: string;
}

export interface HolidayDutyRoster {
  id: number;
  holiday_id: number;
  user_id: number;
  shift_start_time: string;
  shift_end_time: string;
  notes: string | null;
  holiday_name?: string;
  holiday_date?: string;
}

export const holidayApi = {
  getHolidays: (params?: { startDate?: string; endDate?: string; branchId?: number }) =>
    apiClient.get<{ success: boolean; data: { holidays: Holiday[] } }>('/holidays', { params }),
  
  getHolidayById: (id: number) =>
    apiClient.get<{ success: boolean; data: { holiday: Holiday } }>(`/holidays/${id}`),
    
  getMyHolidayDuty: () =>
    apiClient.get<{ success: boolean; data: { rosters: HolidayDutyRoster[] } }>('/holiday-duty-roster/user/me'),
    
  getHolidayDutyByHolidayId: (holidayId: number) =>
    apiClient.get<{ success: boolean; data: { rosters: HolidayDutyRoster[] } }>(`/holiday-duty-roster/${holidayId}`),
};
