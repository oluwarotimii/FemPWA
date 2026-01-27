import apiClient from './apiClient';

interface Form {
  id: number;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

export const formsApi = {
  // Get available forms for staff
  getForms: async (): Promise<{ success: boolean; message: string; data: { forms: Form[] } }> => {
    const response = await apiClient.get('/forms');
    return response.data;
  },
};