const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');

// Main logs fetch endpoint
router.get('/', auditController.getAuditLogs);

module.exports = router;
