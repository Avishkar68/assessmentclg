const mongoose = require('mongoose');
const centralConfig = require('../src/config');
const User = require('../src/models/user.model');
const Question = require('../src/models/question.model');
const Exam = require('../src/models/exam.model');
const { Submission } = require('../src/models/submission.model');

async function run() {
  console.log('--- STARTING DATABASE INDEX VERIFICATION ---');

  // Connect to DB
  console.log('Connecting to database...');
  await mongoose.connect(centralConfig.mongoose.url, centralConfig.mongoose.options);
  console.log('Connected.');

  // Wait for indexes to build/sync
  console.log('Synchronizing indexes...');
  await User.init();
  await Question.init();
  await Exam.init();
  await Submission.init();
  console.log('Indexes synchronized.');

  // Helper to assert index existence
  async function verifyIndexes(model, modelName, expectedKeys) {
    console.log(`\nVerifying indexes on ${modelName} collection...`);
    const indexes = await model.collection.indexes();
    console.log(`Indexes found:`, JSON.stringify(indexes, null, 2));

    for (const key of expectedKeys) {
      // Check if any index contains the key
      const exists = indexes.some((idx) => idx.key[key] !== undefined);
      if (!exists) {
        throw new Error(`Expected index on field "${key}" not found in ${modelName} collection!`);
      }
      console.log(`  [OK] Index on field "${key}" exists.`);
    }
  }

  // Assertions
  await verifyIndexes(User, 'User', ['email']);
  await verifyIndexes(Question, 'Question', ['subject', 'chapter', 'difficulty', 'createdBy']);
  await verifyIndexes(Exam, 'Exam', ['createdBy', 'status']);
  await verifyIndexes(Submission, 'Submission', ['student', 'exam']);

  console.log('\n--- ALL DATABASE INDEXES VERIFIED SUCCESSFULLY ---');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('INDEX VERIFICATION FAILED:', err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
