import api from './api';

const questionService = {
  getQuestions: async (params = {}) => {
    // Send request with page, limit, search, subject, chapter, difficulty params
    const response = await api.get('/questions', { params });
    return response.data; // Expected: { success: true, data: { total, page, pages, results } }
  },

  getQuestionById: async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data; // Expected: { success: true, data: question }
  },

  createQuestion: async (data) => {
    const response = await api.post('/questions', data);
    return response.data; // Expected: { success: true, data: question }
  },

  updateQuestion: async (id, data) => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data; // Expected: { success: true, data: question }
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data; // Expected: { success: true, message: "..." }
  },

  uploadQuestionImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/uploads/question-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Expected: { success: true, data: { imageUrl } }
  },

  uploadBulkQuestions: async (file, isPreview = false) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/questions/upload?preview=${isPreview}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Expected: { success: true, data: results }
  },

  downloadExcelTemplate: async () => {
    const response = await api.get('/questions/template/excel', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'questions_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadCsvTemplate: async () => {
    const response = await api.get('/questions/template/csv', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'questions_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default questionService;
