import apiClient from './apiClient';

export interface LeavePolicySettings {
  id?: number;
  exclude_sundays_from_leave: boolean;
  created_at?: string;
  updated_at?: string;
}

export const leavePolicyApi = {
  getLeavePolicy: async (): Promise<{
    success: boolean;
    message: string;
    data: { settings: LeavePolicySettings };
  }> => {
    const response = await apiClient.get('/leave-policy');
    return response.data;
  },
};
