import apiClient from './apiClient';

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  branch_manager_id?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface BranchesResponse {
  success: boolean;
  message: string;
  data: {
    branches: Branch[];
  };
}

export const branchesApi = {
  // Get all branches
  getAllBranches: async (): Promise<BranchesResponse> => {
    const response = await apiClient.get('/branches');
    return response.data;
  },

  // Get branch by ID
  getBranchById: async (id: number): Promise<{ success: boolean; message: string; data: { branch: Branch } }> => {
    const response = await apiClient.get(`/branches/${id}`);
    return response.data;
  },

  // Get holidays for a branch
  getBranchHolidays: async (branchId: number, year?: number): Promise<{ success: boolean; message: string; data: { holidays: any[] } }> => {
    const params: any = {};
    if (year) {
      params.year = year;
    }
    const response = await apiClient.get(`/branches/${branchId}/holidays`, { params });
    return response.data;
  },
};
