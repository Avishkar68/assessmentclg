const { Submission } = require('../models/submission.model');
const Exam = require('../models/exam.model');
const Question = require('../models/question.model');
const ApiError = require('../utils/ApiError');

/**
 * Service to start or resume an exam attempt for a student
 * @param {string} examId - ID of the exam to start
 * @param {Object} student - Authenticated student user
 * @returns {Promise<Object>} The started/resumed submission document
 */
const startExam = async (examId, student) => {
  // Find exam
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(404, 'Exam not found.');
  }

  // Ensure exam is published
  if (exam.status !== 'published') {
    throw new ApiError(400, 'Cannot start an exam that is not published.');
  }

  // Verify time boundaries
  const now = new Date();
  if (now < exam.startTime) {
    throw new ApiError(400, 'The exam has not started yet.');
  }
  if (now > exam.endTime) {
    throw new ApiError(400, 'The exam window has already closed.');
  }

  // Check if student already has a submission for this exam
  const existingSubmission = await Submission.findOne({
    student: student._id,
    exam: examId
  });

  if (existingSubmission) {
    if (existingSubmission.status === 'submitted') {
      throw new ApiError(400, 'You have already submitted this exam attempt.');
    }
    // If exam is in 'started' state, return existing submission to allow resuming
    return await Submission.findById(existingSubmission._id).populate({
      path: 'exam',
      populate: {
        path: 'questions',
        select: 'questionText type options marks questionImage'
      }
    });
  }

  // Prepopulate answers array with all questions of the exam
  const initialAnswers = exam.questions.map((qId) => ({
    question: qId,
    answerText: '',
    isCorrect: false,
    marksObtained: 0,
    evaluationStatus: 'pending'
  }));

  // Create new submission
  const submission = new Submission({
    student: student._id,
    exam: examId,
    startTime: now,
    status: 'started',
    answers: initialAnswers
  });

  await submission.save();

  return await Submission.findById(submission._id).populate({
    path: 'exam',
    populate: {
      path: 'questions',
      select: 'questionText type options marks questionImage'
    }
  });
};

/**
 * Service to save/update a single answer in an active attempt
 * @param {string} submissionId - ID of the submission attempt
 * @param {Object} answerData - Payload containing questionId and answerText
 * @param {Object} student - Authenticated student user
 * @returns {Promise<Object>} Updated submission document
 */
const saveAnswer = async (submissionId, answerData, student) => {
  const { questionId, answerText } = answerData;

  const submission = await Submission.findById(submissionId).populate('exam');
  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Authorize check
  if (submission.student.toString() !== student._id.toString()) {
    throw new ApiError(403, 'You are not authorized to edit this submission.');
  }

  // Ensure attempt is active
  if (submission.status !== 'started') {
    throw new ApiError(400, 'Cannot save answers on a submitted exam.');
  }

  // Ensure exam time window has not closed
  const now = new Date();
  if (now > submission.exam.endTime) {
    throw new ApiError(400, 'The exam time period has already ended. Answers can no longer be saved.');
  }

  // Verify question is actually part of the exam
  const isQuestionInExam = submission.exam.questions.some(
    (qId) => qId.toString() === questionId
  );
  if (!isQuestionInExam) {
    throw new ApiError(400, 'The specified question does not belong to this exam.');
  }

  // Upsert the answer
  const existingAnswerIndex = submission.answers.findIndex(
    (ans) => ans.question.toString() === questionId
  );

  if (existingAnswerIndex > -1) {
    submission.answers[existingAnswerIndex].answerText = answerText;
  } else {
    submission.answers.push({
      question: questionId,
      answerText
    });
  }

  return await submission.save();
};

/**
 * Service to submit and finalize an active exam attempt
 * @param {string} submissionId - ID of the submission attempt
 * @param {Object} student - Authenticated student user
 * @returns {Promise<Object>} Submitted and graded submission document
 */
const submitExam = async (submissionId, student) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Authorize check
  if (submission.student.toString() !== student._id.toString()) {
    throw new ApiError(403, 'You are not authorized to submit this submission.');
  }

  // Ensure attempt is active
  if (submission.status !== 'started') {
    throw new ApiError(400, 'This exam attempt has already been submitted.');
  }

  // Finalize metadata
  submission.submitTime = new Date();
  submission.status = 'submitted';

  // Load exam and question details to grade the submission
  const exam = await Exam.findById(submission.exam).populate('questions');
  if (!exam) {
    throw new ApiError(404, 'Associated exam not found.');
  }

  let totalScore = 0;

  // Grade each answer in the submission
  for (let ans of submission.answers) {
    const questionObj = exam.questions.find(
      (q) => q._id.toString() === ans.question.toString()
    );

    if (questionObj) {
      const studentAnsClean = (ans.answerText || '').trim();
      
      if (questionObj.type === 'MCQ') {
        const correctAnsClean = (questionObj.correctAnswer || '').trim();
        if (studentAnsClean === correctAnsClean) {
          ans.isCorrect = true;
          ans.marksObtained = questionObj.marks || 0;
          ans.evaluationStatus = 'correct';
        } else {
          ans.isCorrect = false;
          ans.marksObtained = 0;
          ans.evaluationStatus = 'incorrect';
        }
      } else if (questionObj.type === 'Short Answer') {
        // Short answers remain pending evaluation
        ans.isCorrect = undefined;
        ans.marksObtained = 0;
        ans.evaluationStatus = 'pending';
      }
      totalScore += ans.marksObtained;
    }
  }

  submission.score = totalScore;

  // Transition status to 'graded' if all questions are graded (e.g. only MCQs present in the exam)
  const hasPending = submission.answers.some((ans) => ans.evaluationStatus === 'pending');
  if (!hasPending) {
    submission.status = 'graded';
  }

  const savedSubmission = await submission.save();

  if (savedSubmission.status === 'graded') {
    const resultService = require('./result.service');
    await resultService.generateResultForSubmission(savedSubmission._id);

    try {
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        recipient: savedSubmission.student,
        title: 'Result Published',
        message: `Your results for exam "${exam.title}" have been published.`,
        type: 'result_published',
        link: `/student/results`
      });
    } catch (notificationErr) {
      console.error('Error triggering result published notification:', notificationErr);
    }
  } else if (savedSubmission.status === 'submitted') {
    try {
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        recipient: exam.createdBy,
        title: 'Evaluation Pending',
        message: `A submission for exam "${exam.title}" by student "${student.name}" is pending evaluation.`,
        type: 'evaluation_pending',
        link: `/teacher/evaluation/${savedSubmission._id}`
      });
    } catch (notificationErr) {
      console.error('Error triggering evaluation pending notification:', notificationErr);
    }
  }

  return savedSubmission;
};

/**
 * Service to retrieve submissions that are in 'submitted' status and have pending questions.
 * Teachers only retrieve pending submissions for exams they created; Admins retrieve all.
 * @param {Object} user - The authenticated teacher or admin
 * @returns {Promise<Array>} List of pending submission documents
 */
const getPendingSubmissions = async (user) => {
  let examQuery = {};

  if (user.role === 'teacher') {
    // Find all exams created by this teacher
    const teacherExams = await Exam.find({ createdBy: user._id });
    const examIds = teacherExams.map((e) => e._id);
    examQuery = { exam: { $in: examIds } };
  }

  // Query submissions in 'submitted' status, associated with those exams, that have at least one pending answer
  const query = {
    ...examQuery,
    status: 'submitted',
    'answers.evaluationStatus': 'pending'
  };

  return await Submission.find(query)
    .populate('student', 'name email')
    .populate('exam', 'title subject');
};

/**
 * Service for teachers/admins to grade questions (specifically Short Answer questions) manually
 * @param {string} submissionId - ID of the submission
 * @param {Array} evaluations - List of answers to evaluate: [{ questionId, marksObtained, isCorrect, feedback }]
 * @param {string} overallFeedback - Global feedback for the overall exam attempt
 * @param {Object} user - The grading teacher or admin
 * @returns {Promise<Object>} The updated and recalculated submission
 */
const evaluateShortAnswers = async (submissionId, evaluations, overallFeedback, user) => {
  const submission = await Submission.findById(submissionId).populate('exam');
  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Enforce Teacher owner or Admin authority check
  if (user.role !== 'admin' && submission.exam.createdBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to grade this submission.');
  }

  // Ensure submission is submitted before grading
  if (submission.status !== 'submitted' && submission.status !== 'graded') {
    throw new ApiError(400, 'Cannot grade a submission that has not been submitted yet.');
  }

  // Load question details to validate marks boundaries
  const exam = await Exam.findById(submission.exam).populate('questions');

  if (evaluations && Array.isArray(evaluations)) {
    for (let evaluation of evaluations) {
      const { questionId, marksObtained, isCorrect, feedback } = evaluation;

      const answer = submission.answers.find(
        (ans) => ans.question.toString() === questionId
      );

      if (!answer) {
        throw new ApiError(400, `Answer for question ID '${questionId}' not found in this submission.`);
      }

      const questionObj = exam.questions.find(
        (q) => q._id.toString() === questionId
      );

      if (!questionObj) {
        throw new ApiError(400, `Question ID '${questionId}' is not part of this exam.`);
      }

      // Validate marks limits
      if (marksObtained < 0 || marksObtained > questionObj.marks) {
        throw new ApiError(
          400,
          `Marks for question ID '${questionId}' must be between 0 and ${questionObj.marks}. Received: ${marksObtained}`
        );
      }

      // Update answer
      answer.marksObtained = marksObtained;
      answer.isCorrect = isCorrect !== undefined ? isCorrect : marksObtained > 0;
      answer.evaluationStatus = answer.isCorrect ? 'correct' : 'incorrect';
      
      if (feedback !== undefined) {
        answer.feedback = feedback;
      }
    }
  }

  if (overallFeedback !== undefined) {
    submission.feedback = overallFeedback;
  }

  // Recalculate overall submission score
  let newScore = 0;
  for (let ans of submission.answers) {
    newScore += ans.marksObtained || 0;
  }
  submission.score = newScore;

  // Transition status to 'graded' if all questions are graded
  const hasPending = submission.answers.some((ans) => ans.evaluationStatus === 'pending');
  if (!hasPending) {
    submission.status = 'graded';
  }

  const savedSubmission = await submission.save();

  if (savedSubmission.status === 'graded') {
    const resultService = require('./result.service');
    await resultService.generateResultForSubmission(savedSubmission._id);

    try {
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        recipient: savedSubmission.student,
        title: 'Result Published',
        message: `Your results for exam "${submission.exam.title}" have been published.`,
        type: 'result_published',
        link: `/student/results`
      });
    } catch (notificationErr) {
      console.error('Error triggering result published notification from manual grading:', notificationErr);
    }
  }

  return savedSubmission;
};

/**
 * Service to update exam security violation counters
 * @param {string} submissionId - Submission ID
 * @param {Object} violationData - Object containing tabSwitchCount, fullscreenExitCount, copyPasteAttempts
 * @param {Object} student - Authenticated student user object
 * @returns {Promise<Object>} Updated submission document
 */
const updateViolations = async (submissionId, violationData = {}, student) => {
  const submission = await Submission.findById(submissionId);

  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Authorization check: Only the student who created the attempt can post violations
  if (submission.student.toString() !== student._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update violations for this submission.');
  }

  // Enforce locking: Violations can only be updated while active
  if (submission.status !== 'started') {
    throw new ApiError(400, 'Cannot update violations on a finalized exam attempt.');
  }

  const { tabSwitchCount, fullscreenExitCount, copyPasteAttempts } = violationData;

  if (tabSwitchCount !== undefined) {
    submission.tabSwitchCount = tabSwitchCount;
  }
  if (fullscreenExitCount !== undefined) {
    submission.fullscreenExitCount = fullscreenExitCount;
  }
  if (copyPasteAttempts !== undefined) {
    submission.copyPasteAttempts = copyPasteAttempts;
  }

  return await submission.save();
};

/**
 * Service to retrieve all submissions for a student
 * @param {string} studentId - ID of the student user
 * @returns {Promise<Array>} List of student submission documents
 */
const getMySubmissions = async (studentId) => {
  return await Submission.find({ student: studentId })
    .populate('exam', 'title subject description duration startTime endTime totalMarks allowReview showResultsImmediately')
    .sort({ createdAt: -1 });
};

/**
 * Service to retrieve a single submission with details and permission guards
 * @param {string} submissionId - Submission ID
 * @param {Object} user - Authenticated user object (student, teacher, or admin)
 * @returns {Promise<Object>} The submission document
 */
const getSubmissionById = async (submissionId, user) => {
  const submission = await Submission.findById(submissionId)
    .populate('student', 'name email role')
    .populate('exam', 'title subject createdBy allowReview')
    .populate({
      path: 'answers.question',
      select: 'questionText type options correctAnswer expectedAnswer marks questionImage'
    });

  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Role based access logic
  if (user.role === 'student') {
    // Student can only see their own submissions
    if (submission.student._id.toString() !== user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to view this submission details.');
    }
    // Block review if allowReview is false
    if (submission.exam && !submission.exam.allowReview) {
      throw new ApiError(403, 'Review access is disabled by the instructor for this exam.');
    }
  } else if (user.role === 'teacher') {
    // Teacher can only see submissions of exams they created
    if (!submission.exam || submission.exam.createdBy.toString() !== user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to view this submission details.');
    }
  }

  return submission;
};

module.exports = {
  startExam,
  saveAnswer,
  submitExam,
  evaluateShortAnswers,
  getPendingSubmissions,
  updateViolations,
  getSubmissionById,
  getMySubmissions
};

