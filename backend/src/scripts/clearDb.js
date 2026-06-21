const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/user.model');
const Question = require('../models/question.model');
const Exam = require('../models/exam.model');
const { Submission } = require('../models/submission.model');

// Optional result model import, if it exists
let Result;
try {
  Result = require('../models/result.model');
} catch (e) {
  // If no Result model exists, ignore
}

async function clearDb() {
  console.log('Connecting to database for cleanup...');
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected.');

  console.log('Clearing database collections...');
  
  await User.deleteMany({});
  console.log('  Cleared Users collection.');

  await Question.deleteMany({});
  console.log('  Cleared Questions collection.');

  await Exam.deleteMany({});
  console.log('  Cleared Exams collection.');

  await Submission.deleteMany({});
  console.log('  Cleared Submissions collection.');

  if (Result) {
    await Result.deleteMany({});
    console.log('  Cleared Results collection.');
  }

  console.log('Database cleared successfully!');
  await mongoose.disconnect();
  console.log('Disconnected.');
}

clearDb().catch((err) => {
  console.error('Database cleanup failed:', err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
