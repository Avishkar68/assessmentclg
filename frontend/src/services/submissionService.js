import api from './api';

const submissionService = {
  startExam: async (examId) => {
    const response = await api.post('/submissions/start', { examId });
    return response.data; // Expected: { success: true, data: submission }
  },

  saveAnswer: async (submissionId, questionId, answerText) => {
    const response = await api.post(`/submissions/${submissionId}/save`, { questionId, answerText });
    return response.data; // Expected: { success: true, data: submission }
  },

  submitExam: async (submissionId) => {
    const response = await api.post(`/submissions/${submissionId}/submit`);
    return response.data; // Expected: { success: true, data: submission }
  },

  updateViolations: async (submissionId, violationsData) => {
    const response = await api.patch(`/submissions/${submissionId}/violations`, violationsData);
    return response.data; // Expected: { success: true, data: submission }
  },

  getSubmissionById: async (id) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data; // Expected: { success: true, data: submission }
  },

  getPendingSubmissions: async () => {
    const response = await api.get('/submissions/pending');
    return response.data; // Expected: { success: true, data: pendingSubmissions }
  },

  getMySubmissions: async () => {
    const response = await api.get('/submissions/my-submissions');
    return response.data; // Expected: { success: true, data: submissions }
  },

  evaluateSubmission: async (id, evaluationData) => {
    const response = await api.put(`/submissions/${id}/evaluate`, evaluationData);
    return response.data; // Expected: { success: true, data: submission }
  },
};

export default submissionService;
