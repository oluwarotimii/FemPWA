import apiClient from './apiClient';

interface PerformanceScore {
  id: number;
  employee_id: number;
  kpi_id: number;
  template_id: number;
  score: number;
  achieved_value: number;
  period_start: string;
  period_end: string;
  calculated_by: number;
  calculated_at: string;
}

interface Appraisal {
  id: number;
  name: string;
  description: string;
  template_id: number;
  start_date: string;
  end_date: string;
  status: string;
  created_by: number;
  created_at: string;
}

export const performanceApi = {
  // Get performance data for specific employee
  getPerformanceScores: async (employeeId: number): Promise<{ success: boolean; message: string; data: { performanceScores: PerformanceScore[] } }> => {
    const response = await apiClient.get(`/performance/employee/${employeeId}`);
    return response.data;
  },

  // Get appraisal cycles for the employee
  getAppraisals: async (): Promise<{ success: boolean; message: string; data: { appraisals: Appraisal[] } }> => {
    const response = await apiClient.get('/appraisals');
    return response.data;
  },
};