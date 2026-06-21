import api from './api';

const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data; // Expected format: { success: true, data: [...] }
  },

  markAllRead: async () => {
    const response = await api.patch('/notifications/read');
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  }
};

export default notificationService;
