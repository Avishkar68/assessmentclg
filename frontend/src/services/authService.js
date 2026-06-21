import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Expected format: { success: true, message: "...", data: { token, user } }
  },

  register: async (name, email, password, role) => {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data; // Expected format: { success: true, message: "...", data: { token, user } }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data; // Expected format: { success: true, message: "...", data: { user } }
  },

  updateProfile: async (name) => {
    const response = await api.put('/auth/profile', { name });
    return response.data;
  },

  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/auth/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authService;
