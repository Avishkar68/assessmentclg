const User = require('../models/user.model');
const Question = require('../models/question.model');
const Exam = require('../models/exam.model');
const { Submission } = require('../models/submission.model');
const Result = require('../models/result.model');

/**
 * Service to retrieve Admin dashboard stats.
 * Uses live database counts for user roles, placeholders for other entities.
 * @returns {Promise<Object>} Admin stats object
 */
const getAdminStats = async () => {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalTeachers = await User.countDocuments({ role: 'teacher' });

  const totalExams = await Exam.countDocuments(); 
  const totalQuestions = await Question.countDocuments();

  return {
    totalStudents,
    totalTeachers,
    totalExams,
    totalQuestions
  };
};

/**
 * Service to retrieve Teacher dashboard stats.
 * Uses live details for teacher specific exams/submissions.
 * @param {string} teacherId - Mongoose ID of the authenticated teacher
 * @returns {Promise<Object>} Teacher stats object
 */
const getTeacherStats = async (teacherId) => {
  const totalQuestionsCreated = await Question.countDocuments({ createdBy: teacherId });
  const totalExamsCreated = await Exam.countDocuments({ createdBy: teacherId });

  // Find all exams created by this teacher
  const teacherExams = await Exam.find({ createdBy: teacherId });
  const examIds = teacherExams.map((e) => e._id);
  const totalSubmissionsPendingEvaluation = await Submission.countDocuments({
    exam: { $in: examIds },
    status: 'submitted',
    'answers.evaluationStatus': 'pending'
  });

  return {
    totalQuestionsCreated,
    totalExamsCreated,
    totalSubmissionsPendingEvaluation
  };
};

/**
 * Service to retrieve Student dashboard stats.
 * Uses live database details for student specific exams/scores.
 * @param {string} studentId - Mongoose ID of the authenticated student
 * @returns {Promise<Object>} Student stats object
 */
const getStudentStats = async (studentId) => {
  // Get all active and upcoming published exams (ends in the future)
  const upcomingExams = await Exam.find({
    status: 'published',
    endTime: { $gt: new Date() }
  }).select('title description subject duration startTime endTime totalMarks');

  // Get completed exams for this student
  const results = await Result.find({ student: studentId })
    .populate('exam', 'title subject description totalMarks')
    .sort({ createdAt: -1 })
    .limit(5);

  const completedExams = results.map((r) => ({
    id: r._id,
    title: r.exam?.title || 'Unknown Exam',
    score: r.obtainedMarks,
    totalPoints: r.exam?.totalMarks || 100,
    date: r.createdAt
  }));

  // Calculate live average percentage
  const allResults = await Result.find({ student: studentId });
  const totalCompleted = allResults.length;
  const averageScore = totalCompleted > 0
    ? parseFloat((allResults.reduce((sum, r) => sum + r.percentage, 0) / totalCompleted).toFixed(2))
    : 0;

  return {
    upcomingExams,
    completedExams,
    averageScore
  };
};

module.exports = {
  getAdminStats,
  getTeacherStats,
  getStudentStats
};
