import apiClient from './apiClient';

interface Target {
  id: number;
  kpi_id: number;
  employee_id: number;
  department_id: number;
  template_id: number;
  target_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  created_by: number;
  created_at: string;
}

export const targetsApi = {
  // Get targets for specific employee
  getTargets: async (employeeId: number): Promise<{ success: boolean; message: string; data: { targets: Target[] } }> => {
    const response = await apiClient.get(`/targets/employee/${employeeId}`);
    return response.data;
  },
};