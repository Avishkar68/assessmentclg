const Question = require('../models/question.model');
const ApiError = require('../utils/ApiError');
const { executePaginatedQuery } = require('../utils/queryHelper');

/**
 * Service to create a new question
 * @param {Object} questionData - Request payload parameters
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Created question document
 */
const createQuestion = async (questionData, user) => {
  const question = new Question({
    ...questionData,
    createdBy: user._id
  });

  return await question.save();
};

/**
 * Service to get questions list using pagination, filtering, and searching
 * @param {Object} queryParams - Query parameters from request (page, limit, search, etc.)
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Object containing total, page, pages, results
 */
const getQuestions = async (queryParams = {}, user = {}) => {
  let baseFilter = {};

  // Restrict teachers to their own questions; Admins can see all
  if (user.role !== 'admin') {
    baseFilter = { createdBy: user._id };
  }

  return await executePaginatedQuery(
    Question,
    queryParams,
    ['questionText'],
    baseFilter,
    { path: 'createdBy', select: 'name email role' }
  );
};

/**
 * Service to fetch a single question by its ID
 * @param {string} id - Question ID
 * @returns {Promise<Object>} Question document
 */
const getQuestionById = async (id) => {
  const question = await Question.findById(id).populate('createdBy', 'name email role');
  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }
  return question;
};

/**
 * Service to update an existing question with permission control
 * @param {string} id - Question ID
 * @param {Object} updateData - Key-values to update
 * @param {Object} user - Authenticated user updating the question
 * @returns {Promise<Object>} Updated question document
 */
const updateQuestion = async (id, updateData, user) => {
  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  // Teacher role can only manage their own questions; Admins can manage all
  if (user.role !== 'admin' && question.createdBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this question.');
  }

  // Assign update parameters
  Object.keys(updateData).forEach((key) => {
    // Prevent overriding the author
    if (key !== 'createdBy') {
      question[key] = updateData[key];
    }
  });

  return await question.save();
};

/**
 * Service to delete a question with permission check
 * @param {string} id - Question ID
 * @param {Object} user - Authenticated user deleting the question
 * @returns {Promise<void>} Resolves when delete operation completes
 */
const deleteQuestion = async (id, user) => {
  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  // Teacher role can only manage their own questions; Admins can manage all
  if (user.role !== 'admin' && question.createdBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this question.');
  }

  await question.deleteOne();
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
};
