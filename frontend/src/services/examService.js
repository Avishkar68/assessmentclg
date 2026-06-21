import api from './api';

const examService = {
  getExams: async (params = {}) => {
    const response = await api.get('/exams', { params });
    return response.data; // Expected: { success: true, data: { count, exams } }
  },

  getExamById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data; // Expected: { success: true, data: exam }
  },

  createExam: async (examData) => {
    const response = await api.post('/exams', examData);
    return response.data; // Expected: { success: true, data: exam }
  },

  updateExam: async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data; // Expected: { success: true, data: exam }
  },

  deleteExam: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data; // Expected: { success: true, message, data }
  },

  publishExam: async (id) => {
    const response = await api.patch(`/exams/${id}/publish`);
    return response.data; // Expected: { success: true, message, data }
  },

  generateExam: async (generationData) => {
    const response = await api.post('/exams/generate', generationData);
    return response.data; // Expected: { success: true, data: exam }
  },
};

export default examService;
