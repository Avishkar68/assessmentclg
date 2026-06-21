const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { adminTest } = require('../controllers/test.controller');
const { getAdminDashboard } = require('../controllers/dashboard.controller');
const adminController = require('../controllers/admin.controller');

// Configure multer storage in memory for bulk upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  }
});

// Restricted to admins only
router.get('/test', protect, authorize('admin'), adminTest);
router.get('/dashboard', protect, authorize('admin'), getAdminDashboard);

// Subjects & Classes listing (accessible to any logged-in user)
router.get('/subjects', protect, adminController.getSubjects);
router.get('/classes', protect, adminController.getClassRooms);

// Admin Authorized Area
router.use(protect, authorize('admin'));

// Subjects & Classes management (restricted to admins only)
router.post('/subjects', adminController.createSubject);
router.delete('/subjects/:id', adminController.deleteSubject);
router.post('/classes', adminController.createClassRoom);
router.delete('/classes/:id', adminController.deleteClassRoom);

// Teachers Management routes
router
  .route('/teachers')
  .get(adminController.getTeachers)
  .post(adminController.createTeacher);

router
  .route('/teachers/:id')
  .get(adminController.getTeacherById)
  .put(adminController.updateTeacher)
  .delete(adminController.deleteTeacher);

router.patch('/teachers/:id/toggle-status', adminController.toggleTeacherStatus);
router.post('/teachers/:id/reset-password', adminController.resetTeacherPassword);

// Students Management routes
router.post('/students/upload', upload.single('file'), adminController.uploadBulkStudents);

router
  .route('/students')
  .get(adminController.getStudents)
  .post(adminController.createStudent);

router
  .route('/students/:id')
  .get(adminController.getStudentById)
  .put(adminController.updateStudent)
  .delete(adminController.deleteStudent);

router.patch('/students/:id/assign-batch', adminController.assignStudentBatch);

module.exports = router;
