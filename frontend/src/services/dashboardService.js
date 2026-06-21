import api from './api';

const dashboardService = {
  getAdminStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data; // Expected format: { success: true, data: { totalStudents, totalTeachers, totalExams, totalQuestions } }
  },

  getTeacherStats: async () => {
    const response = await api.get('/teacher/dashboard');
    return response.data; // Expected format: { success: true, data: { totalQuestionsCreated, totalExamsCreated, totalSubmissionsPendingEvaluation } }
  },

  getStudentStats: async () => {
    const response = await api.get('/student/dashboard');
    return response.data; // Expected format: { success: true, data: { upcomingExams, completedExams, averageScore } }
  },
};

export default dashboardService;
