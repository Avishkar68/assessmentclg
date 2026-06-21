import api from './api';

const auditService = {
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit', { params });
    return response.data;
  }
};

export default auditService;
