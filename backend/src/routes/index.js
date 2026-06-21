const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs/swagger.json');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const teacherRoutes = require('./teacher.routes');
const studentRoutes = require('./student.routes');
const questionRoutes = require('./question.routes');
const examRoutes = require('./exam.routes');
const submissionRoutes = require('./submission.routes');
const resultRoutes = require('./result.routes');
const analyticsRoutes = require('./analytics.routes');
const uploadRoutes = require('./upload.routes');
const notificationRoutes = require('./notification.routes');
const auditRoutes = require('./audit.routes');
const { protect, authorize } = require('../middleware/auth');

// Swagger UI Route
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Map individual routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/questions', protect, authorize('admin', 'teacher'), questionRoutes);
router.use('/exams', examRoutes);
router.use('/submissions', submissionRoutes);
router.use('/results', resultRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/uploads', protect, authorize('admin', 'teacher'), uploadRoutes);
router.use('/notifications', protect, notificationRoutes);
router.use('/audit', protect, authorize('admin'), auditRoutes);

module.exports = router;
