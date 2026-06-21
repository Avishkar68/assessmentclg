const XLSX = require('xlsx');
const Question = require('../models/question.model');

/**
 * Validates a single parsed row from the Excel/CSV sheet
 * @param {Object} row - Flat JSON object representing a row
 * @param {number} index - Index in the parsed rows array (0-indexed)
 * @returns {Object} Row status containing validity state, errors list, and clean question payload
 */
const validateRow = (row, index) => {
  const errors = [];
  const rowNumber = index + 2; // Row 1 is header in Excel/CSV

  // Normalize inputs mapping multiple typical headers
  const type = row.type || row.Type || '';
  const questionText = row.questionText || row.question || row.QuestionText || row.Question || '';
  const questionImage = row.questionImage || row.image || row.QuestionImage || '';
  const difficulty = row.difficulty || row.Difficulty || 'Medium';
  const subject = row.subject || row.Subject || '';
  const chapter = row.chapter || row.Chapter || '';
  const marksStr = row.marks || row.Marks;

  const cleanType = type.toString().trim();

  if (!cleanType || !['MCQ', 'Short Answer'].includes(cleanType)) {
    errors.push('Question type is required and must be either "MCQ" or "Short Answer".');
  }

  if (!questionText.toString().trim()) {
    errors.push('Question text is required.');
  }

  const cleanDiff = difficulty.toString().trim();
  if (cleanDiff && !['Easy', 'Medium', 'Hard'].includes(cleanDiff)) {
    errors.push('Difficulty must be either "Easy", "Medium", or "Hard".');
  }

  if (!subject.toString().trim()) {
    errors.push('Subject is required.');
  }

  if (!chapter.toString().trim()) {
    errors.push('Chapter is required.');
  }

  const marks = parseInt(marksStr, 10);
  if (isNaN(marks) || marks < 1) {
    errors.push('Marks must be a positive number of at least 1.');
  }

  let parsedOptions = [];
  let correctAnswer = '';
  let expectedAnswer = '';

  if (cleanType === 'MCQ') {
    // Process option array: check single semicolon separated field first
    const optionsCell = row.options || row.Options;
    if (optionsCell && optionsCell.toString().trim()) {
      parsedOptions = optionsCell.toString().split(';').map(opt => opt.trim()).filter(Boolean);
    } else {
      // Otherwise, scan option1..option10 columns
      for (let i = 1; i <= 10; i++) {
        const optVal = row[`option${i}`] || row[`Option${i}`] || row[`option_${i}`] || row[`Option_${i}`];
        if (optVal !== undefined && optVal.toString().trim() !== '') {
          parsedOptions.push(optVal.toString().trim());
        }
      }
    }

    if (parsedOptions.length < 2) {
      errors.push('MCQ questions require at least 2 options.');
    }

    const rawCorrect = row.correctAnswer || row.CorrectAnswer || row.correct_answer || row.Answer || row.answer;
    correctAnswer = rawCorrect !== undefined ? rawCorrect.toString().trim() : '';

    if (!correctAnswer) {
      errors.push('MCQ questions require a correctAnswer.');
    } else if (parsedOptions.length >= 2) {
      // Confirm correctAnswer is one of the choices
      if (!parsedOptions.includes(correctAnswer)) {
        // Fallback: Check if correctAnswer is a 1-based index (e.g., "1" represents option 1)
        const optIndex = parseInt(correctAnswer, 10) - 1;
        if (!isNaN(optIndex) && optIndex >= 0 && optIndex < parsedOptions.length) {
          correctAnswer = parsedOptions[optIndex]; // Map to index string value
        } else {
          errors.push(`The correctAnswer "${correctAnswer}" must match one of the options: [${parsedOptions.join(', ')}].`);
        }
      }
    }
  } else if (cleanType === 'Short Answer') {
    const rawExpected = row.expectedAnswer || row.ExpectedAnswer || row.expected_answer || row.Answer || row.answer;
    expectedAnswer = rawExpected !== undefined ? rawExpected.toString().trim() : '';
    if (!expectedAnswer) {
      errors.push('Short Answer questions require an expectedAnswer.');
    }
  }

  const questionData = {
    type: cleanType,
    questionText: questionText.toString().trim(),
    questionImage: questionImage ? questionImage.toString().trim() : undefined,
    difficulty: cleanDiff || 'Medium',
    subject: subject.toString().trim(),
    chapter: chapter.toString().trim(),
    marks: isNaN(marks) ? 0 : marks,
    options: cleanType === 'MCQ' ? parsedOptions : undefined,
    correctAnswer: cleanType === 'MCQ' ? correctAnswer : undefined,
    expectedAnswer: cleanType === 'Short Answer' ? expectedAnswer : undefined
  };

  return {
    rowNumber,
    isValid: errors.length === 0,
    errors,
    questionData
  };
};

/**
 * Service to parse sheet and process bulk uploads/previews
 * @param {Buffer} fileBuffer - Multipart file stream buffer
 * @param {Object} user - Authenticated creator user object
 * @param {boolean} isPreview - If true, validates but does not commit save to MongoDB
 * @returns {Promise<Object>} Import summary response
 */
const processBulkQuestions = async (fileBuffer, user, isPreview = false) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Parse worksheet rows
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

  const results = {
    totalRows: rawRows.length,
    validCount: 0,
    invalidCount: 0,
    importedCount: 0,
    validRows: [],
    invalidRows: []
  };

  const parsedQuestions = [];

  rawRows.forEach((row, index) => {
    const rowStatus = validateRow(row, index);
    if (rowStatus.isValid) {
      results.validCount++;
      results.validRows.push({
        rowNumber: rowStatus.rowNumber,
        question: rowStatus.questionData
      });
      parsedQuestions.push({
        ...rowStatus.questionData,
        createdBy: user._id
      });
    } else {
      results.invalidCount++;
      results.invalidRows.push({
        rowNumber: rowStatus.rowNumber,
        errors: rowStatus.errors,
        rowRawData: row
      });
    }
  });

  // Bulk save if not running in preview mode
  if (!isPreview && parsedQuestions.length > 0) {
    const savedDocs = await Question.insertMany(parsedQuestions);
    results.importedCount = savedDocs.length;
  }

  return results;
};

/**
 * Service to generate Excel bulk question upload template
 * @returns {Buffer} Excel file buffer
 */
const generateExcelTemplate = () => {
  const headers = [
    'type',
    'questionText',
    'questionImage',
    'difficulty',
    'subject',
    'chapter',
    'marks',
    'options',
    'correctAnswer',
    'expectedAnswer'
  ];

  const sampleData = [
    {
      type: 'MCQ',
      questionText: 'What is the output of typeof null in JavaScript?',
      questionImage: '',
      difficulty: 'Easy',
      subject: 'JavaScript',
      chapter: 'Data Types',
      marks: 2,
      options: 'string; number; object; undefined',
      correctAnswer: 'object',
      expectedAnswer: ''
    },
    {
      type: 'Short Answer',
      questionText: 'Which method is used to serialize an object to JSON string in JavaScript?',
      questionImage: '',
      difficulty: 'Medium',
      subject: 'JavaScript',
      chapter: 'JSON',
      marks: 5,
      options: '',
      correctAnswer: '',
      expectedAnswer: 'JSON.stringify'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Question Template');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Service to generate CSV bulk question upload template
 * @returns {Buffer} CSV file buffer (UTF-8 encoded)
 */
const generateCsvTemplate = () => {
  const headers = [
    'type',
    'questionText',
    'questionImage',
    'difficulty',
    'subject',
    'chapter',
    'marks',
    'options',
    'correctAnswer',
    'expectedAnswer'
  ];

  const sampleData = [
    {
      type: 'MCQ',
      questionText: 'What is the output of typeof null in JavaScript?',
      questionImage: '',
      difficulty: 'Easy',
      subject: 'JavaScript',
      chapter: 'Data Types',
      marks: 2,
      options: 'string; number; object; undefined',
      correctAnswer: 'object',
      expectedAnswer: ''
    },
    {
      type: 'Short Answer',
      questionText: 'Which method is used to serialize an object to JSON string in JavaScript?',
      questionImage: '',
      difficulty: 'Medium',
      subject: 'JavaScript',
      chapter: 'JSON',
      marks: 5,
      options: '',
      correctAnswer: '',
      expectedAnswer: 'JSON.stringify'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  const csvString = XLSX.utils.sheet_to_csv(worksheet);
  return Buffer.from(csvString, 'utf-8');
};

module.exports = {
  processBulkQuestions,
  generateExcelTemplate,
  generateCsvTemplate
};
