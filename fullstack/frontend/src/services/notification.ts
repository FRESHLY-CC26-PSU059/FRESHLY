import api from '../api/axios';

export interface NotificationPayload {
  title: string;
  body: string;
  type?: string;
  data?: any;
}

export interface IndividualNotificationPayload extends NotificationPayload {
  userId: number;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const notificationService = {
  /**
   * Send broadcast notification to all users
   */
  sendBroadcast: async (payload: NotificationPayload) => {
    const response = await api.post('/notifications/broadcast', payload);
    return response.data;
  },

  /**
   * Send notification to a specific user
   */
  sendToUser: async (payload: IndividualNotificationPayload) => {
    const response = await api.post('/notifications/send-to-user', payload);
    return response.data;
  },

  /**
   * Get all notifications for current user
   */
  getNotifications: async (limit: number = 10, offset: number = 0) => {
    const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: number) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Admin-only: list users (matches backend /users?page=&limit=).
  getAllUsers: async (limit: number = 100, page: number = 1) => {
    const response = await api.get(`/users?limit=${limit}&page=${page}`);
    return response.data;
  },
};

export default notificationService;
