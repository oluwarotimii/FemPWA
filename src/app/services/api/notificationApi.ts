import apiClient from './apiClient';

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  delivery_status: 'pending' | 'sent' | 'failed' | 'bounced';
  created_at: string;
  /** Timestamp the user opened this notification — null/undefined means unread. */
  opened_at: string | null;
}

export const notificationApi = {
  // GET /api/notifications/my-notifications — reads notification_logs for the
  // authenticated user. (Not GET /api/notifications, which has no handler.)
  getNotifications: async (params?: { limit?: number; page?: number; type?: string; status?: string }): Promise<{
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
    };
  }> => {
    const response = await apiClient.get('/notifications/my-notifications', { params });
    return response.data;
  },

  markAsRead: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },
};
