import api from './api';

const analyticsService = {
  getStudentAnalytics: async () => {
    const response = await api.get('/analytics/student');
    return response.data; // Expected: { success: true, data: { strongTopics, weakTopics, progressGraphData } }
  },

  getTeacherAnalytics: async () => {
    const response = await api.get('/analytics/teacher');
    return response.data; // Expected: { success: true, data: { questionAccuracy, difficultyAnalysis, examPerformance } }
  },

  getAdminAnalytics: async () => {
    const response = await api.get('/analytics/admin');
    return response.data; // Expected: { success: true, data: { users, exams, questions, submissions } }
  },
};

export default analyticsService;
