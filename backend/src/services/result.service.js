const Result = require('../models/result.model');
const { Submission } = require('../models/submission.model');
const Exam = require('../models/exam.model');
const ApiError = require('../utils/ApiError');

/**
 * Automatically compile and save the result for a graded submission, then recalculate ranks.
 * @param {string} submissionId - ID of the graded submission
 * @returns {Promise<Object>} The generated result document
 */
const generateResultForSubmission = async (submissionId) => {
  const submission = await Submission.findById(submissionId).populate('exam');
  if (!submission) {
    throw new ApiError(404, 'Associated submission not found.');
  }

  if (submission.status !== 'graded') {
    throw new ApiError(400, 'Cannot generate results for an ungraded submission.');
  }

  const obtainedMarks = submission.score || 0;
  const totalMarks = submission.exam.totalMarks || 1;
  const percentage = parseFloat(((obtainedMarks / totalMarks) * 100).toFixed(2));

  // Determine grade based on percentage
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  // Upsert result
  let result = await Result.findOne({ submission: submissionId });
  if (!result) {
    result = new Result({
      student: submission.student,
      exam: submission.exam._id,
      submission: submissionId,
      obtainedMarks,
      percentage,
      grade
    });
  } else {
    result.obtainedMarks = obtainedMarks;
    result.percentage = percentage;
    result.grade = grade;
  }
  await result.save();

  // Recalculate ranks for all graded results of this exam
  const examResults = await Result.find({ exam: submission.exam._id }).sort({ obtainedMarks: -1 });

  let currentRank = 1;
  for (let idx = 0; idx < examResults.length; idx++) {
    // If it's a tie, they get the same rank. Otherwise they get index + 1 rank
    if (idx > 0 && examResults[idx].obtainedMarks < examResults[idx - 1].obtainedMarks) {
      currentRank = idx + 1;
    }
    examResults[idx].rank = currentRank;
    await examResults[idx].save();
  }

  // Return the newly created/updated result populated
  return await Result.findById(result._id)
    .populate('student', 'name email')
    .populate('exam', 'title subject description totalMarks')
    .populate('submission');
};

/**
 * Service to get exam results for a specific student
 * @param {string} studentId - Student User ID
 * @returns {Promise<Array>} List of student results
 */
const getStudentResults = async (studentId) => {
  const results = await Result.find({ student: studentId })
    .populate('exam', 'title subject description totalMarks showResultsImmediately resultsPublished')
    .populate('submission')
    .sort({ createdAt: -1 });

  return results.filter(r => !r.exam || r.exam.resultsPublished === true || r.exam.showResultsImmediately === true);
};

/**
 * Service for teachers to get results of their created exams
 * @param {string} teacherId - Teacher User ID
 * @returns {Promise<Array>} List of student results for this teacher
 */
const getTeacherResults = async (teacherId) => {
  const teacherExams = await Exam.find({ createdBy: teacherId });
  const examIds = teacherExams.map((e) => e._id);

  return await Result.find({ exam: { $in: examIds } })
    .populate('student', 'name email')
    .populate('exam', 'title subject description totalMarks')
    .populate('submission')
    .sort({ createdAt: -1 });
};

/**
 * Service for admins to get all results globally
 * @returns {Promise<Array>} List of all results
 */
const getAdminResults = async () => {
  return await Result.find({})
    .populate('student', 'name email')
    .populate('exam', 'title subject description totalMarks')
    .populate('submission')
    .sort({ createdAt: -1 });
};

module.exports = {
  generateResultForSubmission,
  getStudentResults,
  getTeacherResults,
  getAdminResults
};
