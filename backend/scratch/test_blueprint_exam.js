const URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING BLUEPRINT BASED EXAM GENERATION TESTS ---');

  // Request helper
  async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const status = response.status;
    const data = await response.json();
    return { status, data };
  }

  // 1. Setup Users
  const ts = Date.now();
  const teacherEmail = `t_blue_${ts}@example.com`;
  const teacher2Email = `t2_blue_${ts}@example.com`;
  console.log(`\nRegistering teachers: ${teacherEmail} and ${teacher2Email}...`);
  const tReg = await apiCall('/auth/register', 'POST', { name: 'Blue Teacher', email: teacherEmail, password: 'password123', role: 'teacher' });
  const t2Reg = await apiCall('/auth/register', 'POST', { name: 'Blue Teacher 2', email: teacher2Email, password: 'password123', role: 'teacher' });

  const tToken = tReg.data.data.token;
  const t2Token = t2Reg.data.data.token;

  // 2. Seed 10 questions under Teacher 1
  console.log('\nSeeding 10 questions for subject "Maths_Blue" across chapters & difficulties...');
  const pool = [
    { chapter: 'Chapter 1', difficulty: 'Easy' },
    { chapter: 'Chapter 1', difficulty: 'Easy' },
    { chapter: 'Chapter 1', difficulty: 'Medium' },
    { chapter: 'Chapter 1', difficulty: 'Medium' },
    { chapter: 'Chapter 1', difficulty: 'Hard' },
    { chapter: 'Chapter 2', difficulty: 'Easy' },
    { chapter: 'Chapter 2', difficulty: 'Easy' },
    { chapter: 'Chapter 2', difficulty: 'Medium' },
    { chapter: 'Chapter 2', difficulty: 'Medium' },
    { chapter: 'Chapter 2', difficulty: 'Hard' }
  ];

  for (let idx = 0; idx < pool.length; idx++) {
    const item = pool[idx];
    await apiCall('/questions', 'POST', {
      type: 'MCQ',
      questionText: `Maths Blue Question #${idx + 1} from ${item.chapter} (${item.difficulty})`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      difficulty: item.difficulty,
      subject: 'Maths_Blue',
      chapter: item.chapter,
      marks: 5
    }, tToken);
  }
  console.log('Seeding pool completed.');

  // 3. Test Error - Chapter weights sum to 90% instead of 100%
  console.log('\n--- TEST A: Chapter percentages sum error ---');
  const resA = await apiCall('/exams/blueprint-generate', 'POST', {
    title: 'Blueprint Test A',
    subject: 'Maths_Blue',
    duration: 30,
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    totalMarks: 50,
    totalQuestionsCount: 5,
    chapters: { 'Chapter 1': 50, 'Chapter 2': 40 }, // sums to 90
    difficulties: { Easy: 40, Medium: 40, Hard: 20 }
  }, tToken);
  console.log('Status (should be 400):', resA.status);
  console.log('Message:', resA.data.message);
  console.log('Errors:', JSON.stringify(resA.data.errors, null, 2));
  if (resA.status !== 400 || !resA.data.message.includes('Validation failed')) {
    throw new Error('Expected 400 validation error on chapter weights sum');
  }

  // 4. Test Error - Difficulties weights sum to 110% instead of 100%
  console.log('\n--- TEST B: Difficulty percentages sum error ---');
  const resB = await apiCall('/exams/blueprint-generate', 'POST', {
    title: 'Blueprint Test B',
    subject: 'Maths_Blue',
    duration: 30,
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    totalMarks: 50,
    totalQuestionsCount: 5,
    chapters: { 'Chapter 1': 40, 'Chapter 2': 60 },
    difficulties: { Easy: 50, Medium: 50, Hard: 10 } // sums to 110
  }, tToken);
  console.log('Status (should be 400):', resB.status);
  console.log('Message:', resB.data.message);
  if (resB.status !== 400) {
    throw new Error('Expected 400 validation error on difficulty weights sum');
  }

  // 5. Test Error - Invalid difficulty key provided
  console.log('\n--- TEST C: Invalid difficulty key validator ---');
  const resC = await apiCall('/exams/blueprint-generate', 'POST', {
    title: 'Blueprint Test C',
    subject: 'Maths_Blue',
    duration: 30,
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    totalMarks: 50,
    totalQuestionsCount: 5,
    chapters: { 'Chapter 1': 40, 'Chapter 2': 60 },
    difficulties: { Easy: 50, InvalidDiff: 50 } // Invalid key
  }, tToken);
  console.log('Status (should be 400):', resC.status);
  console.log('Message:', resC.data.message);
  if (resC.status !== 400) {
    throw new Error('Expected 400 validation error on invalid difficulty key');
  }

  // 6. Test Error - Insufficient Questions (requesting 20 questions)
  console.log('\n--- TEST D: Insufficient questions available in DB pool ---');
  const resD = await apiCall('/exams/blueprint-generate', 'POST', {
    title: 'Blueprint Test D',
    subject: 'Maths_Blue',
    duration: 30,
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    totalMarks: 100,
    totalQuestionsCount: 20, // Only 10 exist
    chapters: { 'Chapter 1': 50, 'Chapter 2': 50 },
    difficulties: { Easy: 40, Medium: 40, Hard: 20 }
  }, tToken);
  console.log('Status (should be 400):', resD.status);
  console.log('Message:', resD.data.message);
  if (resD.status !== 400 || !resD.data.message.includes('Insufficient questions')) {
    throw new Error('Expected 400 operational error on insufficient pool');
  }

  // 7. Test Success - Generating blueprint exam (5 questions)
  console.log('\n--- TEST E: Successful Blueprint Exam Generation (5 questions) ---');
  const resE = await apiCall('/exams/blueprint-generate', 'POST', {
    title: 'Final Blueprint Exam',
    description: 'Auto compiled by weights.',
    subject: 'Maths_Blue',
    duration: 60,
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    totalMarks: 25,
    totalQuestionsCount: 5,
    chapters: { 'Chapter 1': 40, 'Chapter 2': 60 }, // chapter distribution: C1=2, C2=3
    difficulties: { Easy: 40, Medium: 40, Hard: 20 } // difficulty distribution: Easy=2, Medium=2, Hard=1
  }, tToken);
  
  console.log('Status (should be 201):', resE.status);
  console.log('Created Exam Title:', resE.data.data.title);
  console.log('Selected Questions IDs Count:', resE.data.data.questions.length);
  if (resE.status !== 201 || resE.data.data.questions.length !== 5) {
    throw new Error('Blueprint exam generation failed');
  }

  // 8. Test Error - Teacher Isolation (Teacher 2 cannot generate Maths_Blue blueprint exam)
  console.log('\n--- TEST F: Teacher isolation verification ---');
  const resF = await apiCall('/exams/blueprint-generate', 'POST', {
    title: 'Final Blueprint Exam T2',
    subject: 'Maths_Blue',
    duration: 60,
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    totalMarks: 25,
    totalQuestionsCount: 5,
    chapters: { 'Chapter 1': 40, 'Chapter 2': 60 },
    difficulties: { Easy: 40, Medium: 40, Hard: 20 }
  }, t2Token); // Using teacher 2 token
  console.log('Status (should be 400):', resF.status);
  console.log('Message:', resF.data.message);
  if (resF.status !== 400 || !resF.data.message.includes('Insufficient questions')) {
    throw new Error('Expected 400 Insufficient questions error due to teacher isolation');
  }

  console.log('\n--- ALL BLUEPRINT BASED EXAM GENERATION TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('BLUEPRINT EXAM TEST FAILED:', err);
  process.exit(1);
});
