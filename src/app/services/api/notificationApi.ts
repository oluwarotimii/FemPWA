import apiClient from './apiClient';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  // Get notifications for the authenticated user
  getNotifications: async (params?: { 
    limit?: number; 
    page?: number; 
    unread_only?: boolean 
  }): Promise<{ 
    success: boolean; 
    message: string; 
    data: { 
      notifications: Notification[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    } 
  }> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },
};