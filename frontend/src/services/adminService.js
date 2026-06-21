import api from './api';

const adminService = {
  // TEACHERS
  getTeachers: async (params = {}) => {
    const response = await api.get('/admin/teachers', { params });
    return response.data; // Expected: { success: true, data: [...] }
  },

  getTeacherById: async (id) => {
    const response = await api.get(`/admin/teachers/${id}`);
    return response.data; // Expected: { success: true, data: teacher }
  },

  createTeacher: async (teacherData) => {
    const response = await api.post('/admin/teachers', teacherData);
    return response.data; // Expected: { success: true, data: teacher }
  },

  updateTeacher: async (id, teacherData) => {
    const response = await api.put(`/admin/teachers/${id}`, teacherData);
    return response.data; // Expected: { success: true, data: teacher }
  },

  deleteTeacher: async (id) => {
    const response = await api.delete(`/admin/teachers/${id}`);
    return response.data; // Expected: { success: true }
  },

  toggleTeacherStatus: async (id) => {
    const response = await api.patch(`/admin/teachers/${id}/toggle-status`);
    return response.data; // Expected: { success: true, data: { isActive } }
  },

  resetTeacherPassword: async (id, password) => {
    const response = await api.post(`/admin/teachers/${id}/reset-password`, { password });
    return response.data; // Expected: { success: true }
  },

  // STUDENTS
  getStudents: async (params = {}) => {
    const response = await api.get('/admin/students', { params });
    return response.data; // Expected: { success: true, data: [...] }
  },

  getStudentById: async (id) => {
    const response = await api.get(`/admin/students/${id}`);
    return response.data; // Expected: { success: true, data: student }
  },

  createStudent: async (studentData) => {
    const response = await api.post('/admin/students', studentData);
    return response.data; // Expected: { success: true, data: student }
  },

  updateStudent: async (id, studentData) => {
    const response = await api.put(`/admin/students/${id}`, studentData);
    return response.data; // Expected: { success: true, data: student }
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data; // Expected: { success: true }
  },

  assignStudentBatch: async (id, cohort) => {
    const response = await api.patch(`/admin/students/${id}/assign-batch`, { cohort });
    return response.data; // Expected: { success: true, data: { cohort } }
  },

  uploadBulkStudents: async (file, isPreview = false) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/students/upload?preview=${isPreview}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Expected: { success: true, data: results }
  },

  // SUBJECTS
  getSubjects: async () => {
    const response = await api.get('/admin/subjects');
    return response.data;
  },

  createSubject: async (name) => {
    const response = await api.post('/admin/subjects', { name });
    return response.data;
  },

  deleteSubject: async (id) => {
    const response = await api.delete(`/admin/subjects/${id}`);
    return response.data;
  },

  // CLASSES / COHORTS
  getClassRooms: async () => {
    const response = await api.get('/admin/classes');
    return response.data;
  },

  createClassRoom: async (name) => {
    const response = await api.post('/admin/classes', { name });
    return response.data;
  },

  deleteClassRoom: async (id) => {
    const response = await api.delete(`/admin/classes/${id}`);
    return response.data;
  }
};

export default adminService;
