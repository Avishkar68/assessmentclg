const Exam = require('../models/exam.model');
const Question = require('../models/question.model');
const ApiError = require('../utils/ApiError');

/**
 * Service to create a new exam
 * @param {Object} examData - Exam parameters
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Created exam document
 */
const createExam = async (examData, user) => {
  const exam = new Exam({
    ...examData,
    createdBy: user._id,
    status: 'draft' // Always defaults to draft status upon creation
  });

  return await exam.save();
};

/**
 * Service to get all exams matching a filter
 * @param {Object} filter - Database query filter criteria
 * @returns {Promise<Array>} List of matching exam documents
 */
const getExams = async (filter = {}) => {
  return await Exam.find(filter)
    .populate('createdBy', 'name email role')
    .populate('questions');
};

/**
 * Service to fetch a single exam by its ID
 * @param {string} id - Exam ID
 * @returns {Promise<Object>} Exam document
 */
const getExamById = async (id) => {
  const exam = await Exam.findById(id)
    .populate('createdBy', 'name email role')
    .populate('questions');
    
  if (!exam) {
    throw new ApiError(404, 'Exam not found.');
  }
  return exam;
};

/**
 * Service to update an existing exam with ownership protection
 * @param {string} id - Exam ID
 * @param {Object} updateData - Key-values to update
 * @param {Object} user - Authenticated user updating the exam
 * @returns {Promise<Object>} Updated exam document
 */
const updateExam = async (id, updateData, user) => {
  const exam = await Exam.findById(id);

  if (!exam) {
    throw new ApiError(404, 'Exam not found.');
  }

  // Authorize check (Teacher owner or Admin allowed)
  if (user.role !== 'admin' && exam.createdBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this exam.');
  }

  // Prevent updates to status or creator via standard PUT/PUT updates
  const prohibitedKeys = ['createdBy', 'status'];

  Object.keys(updateData).forEach((key) => {
    if (!prohibitedKeys.includes(key)) {
      exam[key] = updateData[key];
    }
  });

  return await exam.save();
};

/**
 * Service to delete an exam with ownership check
 * @param {string} id - Exam ID
 * @param {Object} user - Authenticated user deleting the exam
 * @returns {Promise<void>} Resolves when delete operation completes
 */
const deleteExam = async (id, user) => {
  const exam = await Exam.findById(id);

  if (!exam) {
    throw new ApiError(404, 'Exam not found.');
  }

  // Authorize check (Teacher owner or Admin allowed)
  if (user.role !== 'admin' && exam.createdBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this exam.');
  }

  await exam.deleteOne();
};

/**
 * Service to change exam status to 'published' with validation constraints
 * @param {string} id - Exam ID
 * @param {Object} user - Authenticated user publishing the exam
 * @returns {Promise<Object>} Updated exam document
 */
const publishExam = async (id, user) => {
  const exam = await Exam.findById(id);

  if (!exam) {
    throw new ApiError(404, 'Exam not found.');
  }

  // Authorize check (Teacher owner or Admin allowed)
  if (user.role !== 'admin' && exam.createdBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to publish this exam.');
  }

  // Enforce question presence validation before publishing
  if (!exam.questions || exam.questions.length === 0) {
    throw new ApiError(400, 'Cannot publish an exam with no questions. Please add questions first.');
  }

  exam.status = 'published';
  const savedExam = await exam.save();

  try {
    const notificationService = require('./notification.service');
    // Notify the teacher who created the exam
    await notificationService.createNotification({
      recipient: exam.createdBy,
      title: 'Exam Published',
      message: `Your exam "${exam.title}" has been published successfully.`,
      type: 'exam_published',
      link: `/teacher/exams`
    });

    // Notify all active students of the upcoming exam
    const User = require('../models/user.model');
    const students = await User.find({ role: 'student', isActive: true });
    for (let student of students) {
      await notificationService.createNotification({
        recipient: student._id,
        title: 'Upcoming Exam',
        message: `A new exam "${exam.title}" on "${exam.subject}" is available.`,
        type: 'upcoming_exam',
        link: `/student/dashboard`
      });
    }
  } catch (notificationErr) {
    console.error('Error triggering exam publish notifications:', notificationErr);
  }

  return savedExam;
};

/**
 * Automatically generate an exam by randomly selecting questions matching the subject and difficulty criteria.
 * Admins query the global question bank, while Teachers only query their own questions.
 * @param {Object} data - Exam parameters including easyCount, mediumCount, hardCount
 * @param {Object} user - The authenticated teacher or admin
 * @returns {Promise<Object>} The newly created exam document
 */
const generateSmartExam = async (data, user) => {
  const {
    title,
    description,
    subject,
    duration,
    startTime,
    endTime,
    totalMarks,
    easyCount = 0,
    mediumCount = 0,
    hardCount = 0
  } = data;

  // Filter pool by subject
  const query = { subject };

  // Teachers only use their own questions; Admins use all questions
  if (user.role === 'teacher') {
    query.createdBy = user._id;
  }

  const questions = await Question.find(query);

  // Group by difficulty
  const easyQuestions = questions.filter((q) => q.difficulty === 'Easy');
  const mediumQuestions = questions.filter((q) => q.difficulty === 'Medium');
  const hardQuestions = questions.filter((q) => q.difficulty === 'Hard');

  // Verify availability
  if (easyQuestions.length < easyCount) {
    throw new ApiError(
      400,
      `Insufficient Easy questions for subject '${subject}'. Requested: ${easyCount}, Available: ${easyQuestions.length}`
    );
  }
  if (mediumQuestions.length < mediumCount) {
    throw new ApiError(
      400,
      `Insufficient Medium questions for subject '${subject}'. Requested: ${mediumCount}, Available: ${mediumQuestions.length}`
    );
  }
  if (hardQuestions.length < hardCount) {
    throw new ApiError(
      400,
      `Insufficient Hard questions for subject '${subject}'. Requested: ${hardCount}, Available: ${hardQuestions.length}`
    );
  }

  // Random selection helper
  const selectRandom = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const selectedEasy = selectRandom(easyQuestions, easyCount);
  const selectedMedium = selectRandom(mediumQuestions, mediumCount);
  const selectedHard = selectRandom(hardQuestions, hardCount);

  // Combine IDs
  const examQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard].map((q) => q._id);

  const exam = new Exam({
    title,
    description,
    subject,
    duration,
    startTime,
    endTime,
    totalMarks,
    questions: examQuestions,
    createdBy: user._id,
    status: 'draft'
  });

  return await exam.save();
};

/**
 * Service to generate an exam automatically using blueprint distributions
 * @param {Object} data - Exam parameters including chapters and difficulties percentage mappings
 * @param {Object} user - The authenticated teacher or admin
 * @returns {Promise<Object>} The newly created exam document
 */
const generateBlueprintExam = async (data, user) => {
  const {
    title,
    description,
    subject,
    duration,
    startTime,
    endTime,
    totalMarks,
    totalQuestionsCount,
    chapters,
    difficulties
  } = data;

  // 1. Calculate question distribution count using Hamilton Largest Remainder Method
  const targets = [];
  const chaptersKeys = Object.keys(chapters);
  const difficultiesKeys = Object.keys(difficulties);

  for (const chapter of chaptersKeys) {
    for (const difficulty of difficultiesKeys) {
      const chapterPct = chapters[chapter];
      const diffPct = difficulties[difficulty];
      const fraction = totalQuestionsCount * (chapterPct / 100) * (diffPct / 100);
      targets.push({
        chapter,
        difficulty,
        fraction,
        count: Math.floor(fraction)
      });
    }
  }

  let currentTotal = targets.reduce((sum, t) => sum + t.count, 0);
  const remainder = totalQuestionsCount - currentTotal;
  if (remainder > 0) {
    // Sort descending by the fractional part remainder
    targets.sort((a, b) => (b.fraction - b.count) - (a.fraction - a.count));
    for (let i = 0; i < remainder; i++) {
      targets[i].count += 1;
    }
  }

  // Random selection helper
  const selectRandom = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const finalQuestions = [];

  // 2. Fetch and sample questions for each category
  for (const target of targets) {
    if (target.count === 0) continue;

    const query = {
      subject,
      chapter: target.chapter,
      difficulty: target.difficulty
    };

    if (user.role === 'teacher') {
      query.createdBy = user._id;
    }

    const availableQuestions = await Question.find(query);

    if (availableQuestions.length < target.count) {
      throw new ApiError(
        400,
        `Insufficient questions for chapter '${target.chapter}' and difficulty '${target.difficulty}' for subject '${subject}'. Required: ${target.count}, Available: ${availableQuestions.length}`
      );
    }

    const sampled = selectRandom(availableQuestions, target.count);
    finalQuestions.push(...sampled);
  }

  const exam = new Exam({
    title,
    description,
    subject,
    duration,
    startTime,
    endTime,
    totalMarks,
    questions: finalQuestions.map((q) => q._id),
    createdBy: user._id,
    status: 'draft'
  });

  return await exam.save();
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  generateSmartExam,
  generateBlueprintExam
};
