const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
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
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Submission reference is required.'],
      unique: true
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks are required.'],
      min: [0, 'Obtained marks cannot be negative.']
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required.'],
      min: [0, 'Percentage cannot be negative.'],
      max: [100, 'Percentage cannot exceed 100.']
    },
    grade: {
      type: String,
      required: [true, 'Grade is required.'],
      trim: true
    },
    rank: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Result', resultSchema);
