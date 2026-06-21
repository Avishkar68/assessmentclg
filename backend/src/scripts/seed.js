const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/user.model');
const Question = require('../models/question.model');
const Exam = require('../models/exam.model');

async function seed() {
  console.log('Connecting to database for seeding...');
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected.');

  // 1. Seed Admin
  console.log('Creating Admin...');
  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  });
  console.log('  Admin created.');

  // 2. Seed 5 Teachers
  console.log('Creating 5 Teachers...');
  const teacherPromises = [];
  for (let i = 1; i <= 5; i++) {
    teacherPromises.push(
      User.create({
        name: `Teacher ${i}`,
        email: `teacher${i}@example.com`,
        password: 'password123',
        role: 'teacher'
      })
    );
  }
  const teachers = await Promise.all(teacherPromises);
  console.log('  Teachers created.');

  // 3. Seed 50 Students
  console.log('Creating 50 Students...');
  const studentPromises = [];
  for (let i = 1; i <= 50; i++) {
    studentPromises.push(
      User.create({
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        password: 'password123',
        role: 'student'
      })
    );
  }
  await Promise.all(studentPromises);
  console.log('  Students created.');

  // 4. Seed 100 Questions
  console.log('Creating 100 Questions...');
  const subjects = ['Web Development', 'Data Science', 'Cybersecurity'];
  const chapters = {
    'Web Development': ['React Hooks', 'Express Routing'],
    'Data Science': ['NumPy Basics', 'Pandas Aggregations'],
    'Cybersecurity': ['SQL Injection', 'XSS Attacks']
  };

  const questionPayloads = [];

  for (let i = 1; i <= 100; i++) {
    // Distribute teachers as creators
    const creatorTeacher = teachers[(i - 1) % teachers.length];
    
    // Select subject and chapter
    const subject = subjects[(i - 1) % subjects.length];
    const chapterList = chapters[subject];
    const chapter = chapterList[(i - 1) % chapterList.length];

    // Difficulty distribution: ~40% Easy, ~40% Medium, ~20% Hard
    let difficulty = 'Medium';
    if (i <= 40) {
      difficulty = 'Easy';
    } else if (i > 80) {
      difficulty = 'Hard';
    }

    // Type distribution: alternating MCQ and Short Answer
    const type = i % 2 === 1 ? 'MCQ' : 'Short Answer';
    
    const questionText = `${subject} (${chapter}) Question #${i}: Explain or select correct choice for topic content detail.`;

    const questionData = {
      type,
      questionText,
      difficulty,
      subject,
      chapter,
      marks: difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 5 : 8,
      createdBy: creatorTeacher._id
    };

    if (type === 'MCQ') {
      questionData.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      questionData.correctAnswer = 'Option A'; // Default correct answer
    } else {
      questionData.expectedAnswer = 'This is the expected correct text response answer.';
    }

    questionPayloads.push(questionData);
  }

  const seededQuestions = await Question.insertMany(questionPayloads);
  console.log(`  Seeded ${seededQuestions.length} questions.`);

  // 5. Seed 5 Exams
  console.log('Creating 5 Exams...');

  // Helper to filter question pool by subject and Creator (if teacher)
  const getQuestionPool = (subj, creatorId) => {
    return seededQuestions.filter(
      (q) => q.subject === subj && q.createdBy.toString() === creatorId.toString()
    );
  };

  const selectRandom = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((q) => q._id);
  };

  // Exam 1: Web Development (Status: draft, creator: Teacher 1, questions count: 5)
  const pool1 = getQuestionPool('Web Development', teachers[0]._id);
  const exam1 = await Exam.create({
    title: 'Intro to Web Development',
    description: 'Draft quiz covering React and routing basics.',
    subject: 'Web Development',
    cohort: 'Grade 10',
    duration: 30,
    startTime: new Date(Date.now() + 86400000), // tomorrow
    endTime: new Date(Date.now() + 90000000),
    totalMarks: pool1.reduce((sum, q) => sum + q.marks, 0),
    status: 'draft',
    createdBy: teachers[0]._id,
    questions: selectRandom(pool1, Math.min(pool1.length, 5))
  });

  // Exam 2: Web Development (Status: published, creator: Teacher 2, questions count: 8)
  const pool2 = getQuestionPool('Web Development', teachers[1]._id);
  const exam2 = await Exam.create({
    title: 'Advanced Web Engineering',
    description: 'Published final test on Web engineering.',
    subject: 'Web Development',
    cohort: 'Grade 10',
    duration: 60,
    startTime: new Date(Date.now() - 300000), // started 5 mins ago
    endTime: new Date(Date.now() + 3600000),  // ends in 1 hour
    totalMarks: pool2.reduce((sum, q) => sum + q.marks, 0),
    status: 'published',
    createdBy: teachers[1]._id,
    questions: selectRandom(pool2, Math.min(pool2.length, 8))
  });

  // Exam 3: Data Science (Status: published, creator: Teacher 3, questions count: 10)
  const pool3 = getQuestionPool('Data Science', teachers[2]._id);
  const exam3 = await Exam.create({
    title: 'Data Science Midterm',
    description: 'Published exam on pandas operations.',
    subject: 'Data Science',
    cohort: 'Grade 10',
    duration: 90,
    startTime: new Date(Date.now() - 600000), // started 10 mins ago
    endTime: new Date(Date.now() + 5400000),
    totalMarks: pool3.reduce((sum, q) => sum + q.marks, 0),
    status: 'published',
    createdBy: teachers[2]._id,
    questions: selectRandom(pool3, Math.min(pool3.length, 10))
  });

  // Exam 4: Cybersecurity (Status: closed, creator: Teacher 4, questions count: 6)
  const pool4 = getQuestionPool('Cybersecurity', teachers[3]._id);
  const exam4 = await Exam.create({
    title: 'Cybersecurity Assessment',
    description: 'Closed final exam covering system attacks.',
    subject: 'Cybersecurity',
    cohort: 'Grade 10',
    duration: 45,
    startTime: new Date(Date.now() - 86400000), // yesterday
    endTime: new Date(Date.now() - 82800000),
    totalMarks: pool4.reduce((sum, q) => sum + q.marks, 0),
    status: 'closed',
    createdBy: teachers[3]._id,
    questions: selectRandom(pool4, Math.min(pool4.length, 6))
  });

  // Exam 5: Web Development (Status: published, creator: Teacher 5, questions count: 7)
  const pool5 = getQuestionPool('Web Development', teachers[4]._id);
  const exam5 = await Exam.create({
    title: 'Full Stack Development Quiz',
    description: 'Published react hooks and routing test.',
    subject: 'Web Development',
    cohort: 'Grade 10',
    duration: 50,
    startTime: new Date(Date.now() + 3600000), // starts in 1 hour
    endTime: new Date(Date.now() + 7200000),
    totalMarks: pool5.reduce((sum, q) => sum + q.marks, 0),
    status: 'published',
    createdBy: teachers[4]._id,
    questions: selectRandom(pool5, Math.min(pool5.length, 7))
  });

  console.log('  5 Exams created successfully.');

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
  await mongoose.disconnect();
  console.log('Disconnected.');
}

seed().catch((err) => {
  console.error('Database seeding failed:', err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
