const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required.']
    },
    action: {
      type: String,
      required: [true, 'Action is required.'],
      enum: {
        values: [
          'login',
          'logout',
          'question_created',
          'question_updated',
          'exam_created',
          'exam_published',
          'evaluation_submitted'
        ],
        message: 'Invalid action type.'
      }
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
