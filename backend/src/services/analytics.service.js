const Question = require('../models/question.model');
const Exam = require('../models/exam.model');
const { Submission } = require('../models/submission.model');
const Result = require('../models/result.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

/**
 * Service to compile detailed performance analytics for a Teacher
 * @param {string} teacherId - Teacher User ID
 * @returns {Promise<Object>} Teacher analytics data (Question accuracy, difficulty analysis, exam metrics)
 */
const getTeacherAnalytics = async (teacherId) => {
  // 1. Fetch teacher's questions
  const questions = await Question.find({ createdBy: teacherId });
  const questionIds = questions.map((q) => q._id);

  // 2. Fetch all graded submissions containing answers to teacher's questions
  const submissions = await Submission.find({
    status: 'graded',
    'answers.question': { $in: questionIds }
  });

  // Calculate Question Accuracy
  const accuracyMap = {};
  questions.forEach((q) => {
    accuracyMap[q._id.toString()] = {
      questionId: q._id,
      questionText: q.questionText,
      type: q.type,
      difficulty: q.difficulty,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0
    };
  });

  submissions.forEach((sub) => {
    sub.answers.forEach((ans) => {
      const qIdStr = ans.question.toString();
      if (accuracyMap[qIdStr]) {
        accuracyMap[qIdStr].totalAttempts++;
        if (ans.isCorrect) {
          accuracyMap[qIdStr].correctAttempts++;
        }
      }
    });
  });

  const questionAccuracy = Object.values(accuracyMap).map((item) => {
    item.accuracy = item.totalAttempts > 0
      ? parseFloat(((item.correctAttempts / item.totalAttempts) * 100).toFixed(2))
      : 0;
    return item;
  });

  // Calculate Difficulty Analysis
  const diffMap = {
    Easy: { sum: 0, count: 0 },
    Medium: { sum: 0, count: 0 },
    Hard: { sum: 0, count: 0 }
  };

  questionAccuracy.forEach((item) => {
    if (diffMap[item.difficulty]) {
      diffMap[item.difficulty].sum += item.accuracy;
      diffMap[item.difficulty].count++;
    }
  });

  const difficultyAnalysis = Object.keys(diffMap).map((diff) => {
    const avg = diffMap[diff].count > 0
      ? parseFloat((diffMap[diff].sum / diffMap[diff].count).toFixed(2))
      : 0;
    return {
      difficulty: diff,
      averageAccuracy: avg,
      questionCount: diffMap[diff].count
    };
  });

  // Calculate Exam Performance
  const teacherExams = await Exam.find({ createdBy: teacherId });
  const examIds = teacherExams.map((e) => e._id);
  const results = await Result.find({ exam: { $in: examIds } }).populate('exam', 'title subject');

  const examPerfMap = {};
  teacherExams.forEach((exam) => {
    examPerfMap[exam._id.toString()] = {
      examId: exam._id,
      title: exam.title,
      subject: exam.subject,
      totalMarks: exam.totalMarks,
      participants: 0,
      scores: []
    };
  });

  results.forEach((res) => {
    const examIdStr = res.exam._id.toString();
    if (examPerfMap[examIdStr]) {
      examPerfMap[examIdStr].participants++;
      examPerfMap[examIdStr].scores.push(res.obtainedMarks);
    }
  });

  const examPerformance = Object.values(examPerfMap).map((item) => {
    const scores = item.scores;
    const avgScore = scores.length > 0
      ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    delete item.scores;
    return {
      ...item,
      averageScore: avgScore,
      highestScore,
      lowestScore
    };
  });

  return {
    questionAccuracy,
    difficultyAnalysis,
    examPerformance
  };
};

/**
 * Service to compile detailed performance analytics for a Student
 * @param {string} studentId - Student User ID
 * @returns {Promise<Object>} Student analytics data (Strong/weak topics, progress graph details)
 */
const getStudentAnalytics = async (studentId) => {
  const results = await Result.find({ student: studentId }).populate('exam', 'title subject totalMarks');

  // Compute Strong & Weak Topics grouped by subject
  const subjectMap = {};
  results.forEach((res) => {
    const subject = res.exam.subject;
    if (!subjectMap[subject]) {
      subjectMap[subject] = { sum: 0, count: 0 };
    }
    subjectMap[subject].sum += res.percentage;
    subjectMap[subject].count++;
  });

  const subjectAverages = Object.keys(subjectMap).map((subject) => {
    const avg = parseFloat((subjectMap[subject].sum / subjectMap[subject].count).toFixed(2));
    return { subject, averagePercentage: avg };
  });

  const strongTopics = subjectAverages
    .filter((item) => item.averagePercentage >= 70)
    .sort((a, b) => b.averagePercentage - a.averagePercentage);

  const weakTopics = subjectAverages
    .filter((item) => item.averagePercentage < 60)
    .sort((a, b) => a.averagePercentage - b.averagePercentage);

  // Compute Progress Graph Data
  const sortedResults = [...results].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const progressGraphData = sortedResults.map((res) => ({
    examTitle: res.exam.title,
    subject: res.exam.subject,
    percentage: res.percentage,
    obtainedMarks: res.obtainedMarks,
    totalMarks: res.exam.totalMarks,
    date: res.createdAt
  }));

  return {
    strongTopics,
    weakTopics,
    progressGraphData
  };
};

/**
 * Service to aggregate platform-wide statistics for Administrators
 * @returns {Promise<Object>} Aggregated metrics count object
 */
const getAdminAnalytics = async () => {
  const totalUsers = await User.countDocuments();
  const adminCount = await User.countDocuments({ role: 'admin' });
  const teacherCount = await User.countDocuments({ role: 'teacher' });
  const studentCount = await User.countDocuments({ role: 'student' });

  const totalExams = await Exam.countDocuments();
  const draftExams = await Exam.countDocuments({ status: 'draft' });
  const publishedExams = await Exam.countDocuments({ status: 'published' });
  const closedExams = await Exam.countDocuments({ status: 'closed' });

  const totalQuestions = await Question.countDocuments();
  const mcqQuestions = await Question.countDocuments({ type: 'MCQ' });
  const saQuestions = await Question.countDocuments({ type: 'Short Answer' });
  const easyQuestions = await Question.countDocuments({ difficulty: 'Easy' });
  const mediumQuestions = await Question.countDocuments({ difficulty: 'Medium' });
  const hardQuestions = await Question.countDocuments({ difficulty: 'Hard' });

  const totalSubmissions = await Submission.countDocuments();
  const startedSubmissions = await Submission.countDocuments({ status: 'started' });
  const submittedSubmissions = await Submission.countDocuments({ status: 'submitted' });
  const gradedSubmissions = await Submission.countDocuments({ status: 'graded' });

  return {
    users: {
      total: totalUsers,
      admin: adminCount,
      teacher: teacherCount,
      student: studentCount
    },
    exams: {
      total: totalExams,
      draft: draftExams,
      published: publishedExams,
      closed: closedExams
    },
    questions: {
      total: totalQuestions,
      mcq: mcqQuestions,
      shortAnswer: saQuestions,
      easy: easyQuestions,
      medium: mediumQuestions,
      hard: hardQuestions
    },
    submissions: {
      total: totalSubmissions,
      started: startedSubmissions,
      submitted: submittedSubmissions,
      graded: gradedSubmissions
    }
  };
};

module.exports = {
  getTeacherAnalytics,
  getStudentAnalytics,
  getAdminAnalytics
};
