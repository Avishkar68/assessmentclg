const mongoose = require('mongoose');
const centralConfig = require('../src/config');
const User = require('../src/models/user.model');
const Question = require('../src/models/question.model');
const Exam = require('../src/models/exam.model');

async function run() {
  console.log('--- STARTING SEED INTEGRITY VERIFICATION ---');

  // Connect to DB
  console.log('Connecting to database...');
  await mongoose.connect(centralConfig.mongoose.url, centralConfig.mongoose.options);
  console.log('Connected.');

  const usersCount = await User.countDocuments();
  const questionsCount = await Question.countDocuments();
  const examsCount = await Exam.countDocuments();

  console.log('\nVerification Counts:');
  console.log('  Users Count (expected: 56):', usersCount);
  console.log('  Questions Count (expected: 100):', questionsCount);
  console.log('  Exams Count (expected: 5):', examsCount);

  if (usersCount !== 56) {
    throw new Error(`Expected exactly 56 users in the database, found ${usersCount}`);
  }
  if (questionsCount !== 100) {
    throw new Error(`Expected exactly 100 questions in the database, found ${questionsCount}`);
  }
  if (examsCount !== 5) {
    throw new Error(`Expected exactly 5 exams in the database, found ${examsCount}`);
  }

  // Print a breakdown of users
  const adminCount = await User.countDocuments({ role: 'admin' });
  const teacherCount = await User.countDocuments({ role: 'teacher' });
  const studentCount = await User.countDocuments({ role: 'student' });
  console.log('  Admin count:', adminCount);
  console.log('  Teacher count:', teacherCount);
  console.log('  Student count:', studentCount);

  console.log('\n--- DATABASE SEED DATA INTEGRITY FULLY VERIFIED ---');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('SEED VERIFICATION FAILED:', err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
