const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const { protect, authorize } = require('../middleware/auth');

router.get(
  '/student',
  protect,
  authorize('student'),
  resultController.getStudentResults
);

router.get(
  '/teacher',
  protect,
  authorize('teacher'),
  resultController.getTeacherResults
);

router.get(
  '/admin',
  protect,
  authorize('admin'),
  resultController.getAdminResults
);

module.exports = router;
