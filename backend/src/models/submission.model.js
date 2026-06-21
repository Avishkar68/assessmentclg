const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required.']
    },
    answerText: {
      type: String,
      default: '',
      trim: true
    },
    isCorrect: {
      type: Boolean
    },
    marksObtained: {
      type: Number,
      default: 0
    },
    evaluationStatus: {
      type: String,
      enum: {
        values: ['correct', 'incorrect', 'pending'],
        message: 'evaluationStatus must be correct, incorrect, or pending.'
      },
      default: 'pending'
    },
    feedback: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    _id: true
  }
);

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required.']
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required.']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required.'],
      default: Date.now
    },
    submitTime: {
      type: Date
    },
    status: {
      type: String,
      enum: {
        values: ['started', 'submitted', 'graded'],
        message: 'Status must be started, submitted, or graded.'
      },
      default: 'started'
    },
    answers: [studentAnswerSchema],
    tabSwitchCount: {
      type: Number,
      default: 0,
      min: 0
    },
    fullscreenExitCount: {
      type: Number,
      default: 0,
      min: 0
    },
    copyPasteAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    score: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

submissionSchema.index({ student: 1 });
submissionSchema.index({ exam: 1 });

const StudentAnswer = mongoose.model('StudentAnswer', studentAnswerSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = {
  Submission,
  StudentAnswer
};
