const URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING PAGINATION, SEARCHING AND FILTERING TEST ---');

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

  // 1. Create a clean user to run tests
  const ts = Date.now();
  const teacherEmail = `t_page_${ts}@example.com`;
  console.log(`\nRegistering teacher: ${teacherEmail}...`);
  const regRes = await apiCall('/auth/register', 'POST', {
    name: 'Paging Teacher',
    email: teacherEmail,
    password: 'password123',
    role: 'teacher'
  });
  const token = regRes.data.data.token;

  // 2. Seed 15 questions
  console.log('\nSeeding 15 questions...');
  
  // 5 Web Dev - Hooks - Easy questions
  for (let i = 1; i <= 5; i++) {
    await apiCall('/questions', 'POST', {
      type: 'MCQ',
      questionText: `React Hooks Question #${i}: How to use useState?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      difficulty: 'Easy',
      subject: 'Web Development',
      chapter: 'Hooks',
      marks: 2
    }, token);
  }

  // 5 Web Dev - State - Medium questions
  for (let i = 1; i <= 5; i++) {
    await apiCall('/questions', 'POST', {
      type: 'Short Answer',
      questionText: `React State Question #${i}: Explain Redux store workflow.`,
      expectedAnswer: 'Store is single source of truth.',
      difficulty: 'Medium',
      subject: 'Web Development',
      chapter: 'State',
      marks: 5
    }, token);
  }

  // 5 Node.js - Express - Hard questions
  for (let i = 1; i <= 5; i++) {
    await apiCall('/questions', 'POST', {
      type: 'MCQ',
      questionText: `Express routing Question #${i}: How to set up router prefix?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      difficulty: 'Hard',
      subject: 'Node.js',
      chapter: 'Express',
      marks: 8
    }, token);
  }

  console.log('Seeding completed.');

  // 3. Test Pagination: Page 1, Limit 5
  console.log('\n--- TEST A: Pagination (Page 1, Limit 5) ---');
  const resA = await apiCall('/questions?page=1&limit=5', 'GET', null, token);
  console.log('Status:', resA.status);
  console.log('Total:', resA.data.data.total);
  console.log('Page:', resA.data.data.page);
  console.log('Pages:', resA.data.data.pages);
  console.log('Results Count:', resA.data.data.results.length);
  
  if (resA.data.data.total !== 15) throw new Error('Expected total to be 15');
  if (resA.data.data.page !== 1) throw new Error('Expected page to be 1');
  if (resA.data.data.pages !== 3) throw new Error('Expected pages to be 3');
  if (resA.data.data.results.length !== 5) throw new Error('Expected results count to be 5');

  // 4. Test Pagination: Page 2, Limit 5
  console.log('\n--- TEST B: Pagination (Page 2, Limit 5) ---');
  const resB = await apiCall('/questions?page=2&limit=5', 'GET', null, token);
  console.log('Status:', resB.status);
  console.log('Total:', resB.data.data.total);
  console.log('Page:', resB.data.data.page);
  console.log('Pages:', resB.data.data.pages);
  console.log('Results Count:', resB.data.data.results.length);
  
  if (resB.data.data.results.length !== 5) throw new Error('Expected results count to be 5 on page 2');

  // 5. Test Search: search=React
  console.log('\n--- TEST C: Search (search=React) ---');
  const resC = await apiCall('/questions?search=React', 'GET', null, token);
  console.log('Total Matching "React":', resC.data.data.total);
  if (resC.data.data.total !== 10) throw new Error('Expected search total to be 10');
  
  // 6. Test Search: search=routing
  console.log('\n--- TEST D: Search (search=routing) ---');
  const resD = await apiCall('/questions?search=routing', 'GET', null, token);
  console.log('Total Matching "routing":', resD.data.data.total);
  if (resD.data.data.total !== 5) throw new Error('Expected search total to be 5');

  // 7. Test Filtering: subject=Web Development & difficulty=Easy
  console.log('\n--- TEST E: Filtering (subject="Web Development" & difficulty="Easy") ---');
  const resE = await apiCall('/questions?subject=Web Development&difficulty=Easy', 'GET', null, token);
  console.log('Total filtered:', resE.data.data.total);
  if (resE.data.data.total !== 5) throw new Error('Expected filter total to be 5');

  // 8. Test Combined: page=1&limit=2&search=useState&subject=Web Development&difficulty=Easy
  console.log('\n--- TEST F: Combined (page=1, limit=2, search=useState, subject="Web Development", difficulty="Easy") ---');
  const resF = await apiCall('/questions?page=1&limit=2&search=useState&subject=Web Development&difficulty=Easy', 'GET', null, token);
  console.log('Total matching:', resF.data.data.total);
  console.log('Returned count:', resF.data.data.results.length);
  if (resF.data.data.total !== 5) throw new Error('Expected total matching base filter and search term to be 5');
  if (resF.data.data.results.length !== 2) throw new Error('Expected limit 2 to yield 2 items');

  console.log('\n--- ALL PAGINATION, SEARCH, AND FILTER TESTS PASSED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('PAGINATION TEST FAILED:', err);
  process.exit(1);
});
