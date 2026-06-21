const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required.'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters.']
    },
    description: {
      type: String,
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required.'],
      trim: true
    },
    cohort: {
      type: String,
      required: [true, 'Class/cohort target is required.'],
      trim: true,
      default: ''
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required.'],
      min: [1, 'Duration must be at least 1 minute.']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required.']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required.']
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required.'],
      min: [1, 'Total marks must be at least 1.']
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'closed'],
        message: 'Status must be either draft, published, or closed.'
      },
      default: 'draft'
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator (createdBy) reference is required.']
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    allowBackNavigation: {
      type: Boolean,
      default: true
    },
    autoSubmit: {
      type: Boolean,
      default: true
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    resultsPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1 });

// Pre-validate hook to verify end time is after start time
examSchema.pre('validate', function () {
  if (this.startTime && this.endTime) {
    if (this.endTime <= this.startTime) {
      this.invalidate('endTime', 'End time must be after start time.');
    }
  }
});

module.exports = mongoose.model('Exam', examSchema);
