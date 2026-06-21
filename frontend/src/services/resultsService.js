import api from './api';

const resultsService = {
  getStudentResults: async () => {
    const response = await api.get('/results/student');
    return response.data; // Expected: { success: true, data: { count, results } }
  },

  getTeacherResults: async () => {
    const response = await api.get('/results/teacher');
    return response.data; // Expected: { success: true, data: { count, results } }
  },

  getAdminResults: async () => {
    const response = await api.get('/results/admin');
    return response.data; // Expected: { success: true, data: { count, results } }
  },
};

export default resultsService;
