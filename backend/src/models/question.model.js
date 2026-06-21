const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Question type is required'],
      enum: {
        values: ['MCQ', 'Short Answer'],
        message: 'Question type must be MCQ or Short Answer'
      }
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    questionImage: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard'
      },
      default: 'Medium'
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    chapter: {
      type: String,
      required: [true, 'Chapter is required'],
      trim: true
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [1, 'Marks must be at least 1']
    },
    // MCQ fields
    options: {
      type: [String],
      // Required if type is MCQ, validated below
    },
    correctAnswer: {
      type: String,
      trim: true
      // Required if type is MCQ, validated below
    },
    // Short Answer fields
    expectedAnswer: {
      type: String,
      trim: true
      // Required if type is Short Answer, validated below
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author (createdBy) user reference is required']
    }
  },
  {
    timestamps: true
  }
);

questionSchema.index({ subject: 1 });
questionSchema.index({ chapter: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ createdBy: 1 });

// Custom validations to enforce type consistency before saving
questionSchema.pre('validate', function () {
  if (this.type === 'MCQ') {
    if (!this.options || !Array.isArray(this.options) || this.options.length < 2) {
      this.invalidate('options', 'MCQ questions must have at least 2 options');
    }
    if (!this.correctAnswer || this.correctAnswer.trim() === '') {
      this.invalidate('correctAnswer', 'MCQ questions must specify the correctAnswer option value');
    }
  } else if (this.type === 'Short Answer') {
    if (!this.expectedAnswer || this.expectedAnswer.trim() === '') {
      this.invalidate('expectedAnswer', 'Short Answer questions must specify the expectedAnswer value');
    }
    // Clean MCQ fields from short answer schemas
    this.options = undefined;
    this.correctAnswer = undefined;
  }
});

module.exports = mongoose.model('Question', questionSchema);
