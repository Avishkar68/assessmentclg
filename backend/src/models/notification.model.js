const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required.']
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true
    },
    type: {
      type: String,
      enum: {
        values: [
          'exam_published',
          'evaluation_pending',
          'upcoming_exam',
          'result_published',
          'new_teacher_added'
        ],
        message: 'Invalid notification type.'
      },
      required: [true, 'Notification type is required.']
    },
    link: {
      type: String,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
