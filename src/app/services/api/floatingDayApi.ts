import apiClient from './apiClient';

export interface FloatingDayRequest {
  id: number;
  user_id: number;
  time_off_bank_id: number;
  program_name?: string;
  user_name?: string;
  date: string;
  reason: string | null;
  status: 'pending' | 'cleared' | 'approved' | 'rejected' | 'cancelled';
  cleared_by: number | null;
  cleared_by_name?: string;
  cleared_at: string | null;
  approved_by: number | null;
  approved_by_name?: string;
  approved_at: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TimeOffBank {
  id: number;
  program_name: string;
  description: string;
  total_entitled_days: number;
  used_days: number;
  available_days: number;
  valid_from: string;
  valid_to: string;
}

export const floatingDayApi = {
  getMyBalance: async (): Promise<{
    success: boolean;
    data: { timeOffBanks: TimeOffBank[] };
  }> => {
    const response = await apiClient.get('/floating-days/my-balance');
    return response.data;
  },

  getMyRequests: async (): Promise<{
    success: boolean;
    data: { requests: FloatingDayRequest[] };
  }> => {
    const response = await apiClient.get('/floating-days');
    return response.data;
  },

  getAllRequests: async (params?: {
    status?: string;
  }): Promise<{
    success: boolean;
    data: { requests: FloatingDayRequest[] };
  }> => {
    const response = await apiClient.get('/floating-days', { params });
    return response.data;
  },

  getPendingForMe: async (): Promise<{
    success: boolean;
    data: { requests: FloatingDayRequest[] };
  }> => {
    const response = await apiClient.get('/floating-days/pending-for-me');
    return response.data;
  },

  getCleared: async (): Promise<{
    success: boolean;
    data: { requests: FloatingDayRequest[] };
  }> => {
    const response = await apiClient.get('/floating-days/cleared');
    return response.data;
  },

  create: async (data: {
    time_off_bank_id: number;
    date: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: { request: FloatingDayRequest };
  }> => {
    const response = await apiClient.post('/floating-days', data);
    return response.data;
  },

  clear: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { requestId: number };
  }> => {
    const response = await apiClient.put(`/floating-days/${id}/clear`);
    return response.data;
  },

  approve: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { requestId: number };
  }> => {
    const response = await apiClient.put(`/floating-days/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, rejection_reason: string): Promise<{
    success: boolean;
    message: string;
    data: { requestId: number };
  }> => {
    const response = await apiClient.put(`/floating-days/${id}/reject`, { rejection_reason });
    return response.data;
  },

  cancel: async (id: number): Promise<{
    success: boolean;
    message: string;
    data: { requestId: number };
  }> => {
    const response = await apiClient.put(`/floating-days/${id}/cancel`);
    return response.data;
  },
};
