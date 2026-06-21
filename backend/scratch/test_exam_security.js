const URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING EXAM SECURITY VIOLATIONS SYSTEM TESTS ---');

  // Helper for JSON calls
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
  const teacherEmail = `t_sec_${ts}@example.com`;
  const teacher2Email = `t2_sec_${ts}@example.com`;
  const studentAEmail = `sa_sec_${ts}@example.com`;
  const studentBEmail = `sb_sec_${ts}@example.com`;

  console.log('\nRegistering Teacher 1, Teacher 2, Student A, and Student B...');
  const tReg = await apiCall('/auth/register', 'POST', { name: 'Sec Teacher', email: teacherEmail, password: 'password123', role: 'teacher' });
  const t2Reg = await apiCall('/auth/register', 'POST', { name: 'Sec Teacher 2', email: teacher2Email, password: 'password123', role: 'teacher' });
  const saReg = await apiCall('/auth/register', 'POST', { name: 'Student A', email: studentAEmail, password: 'password123', role: 'student' });
  const sbReg = await apiCall('/auth/register', 'POST', { name: 'Student B', email: studentBEmail, password: 'password123', role: 'student' });

  const tToken = tReg.data.data.token;
  const t2Token = t2Reg.data.data.token;
  const saToken = saReg.data.data.token;
  const sbToken = sbReg.data.data.token;

  // 2. Setup Question and Exam
  console.log('\nCreating Question and publishing Exam...');
  const qRes = await apiCall('/questions', 'POST', {
    type: 'MCQ',
    questionText: 'Which keyword defines a constant in JavaScript?',
    options: ['var', 'let', 'const', 'define'],
    correctAnswer: 'const',
    difficulty: 'Easy',
    subject: 'JS Security',
    chapter: 'Basics',
    marks: 2
  }, tToken);
  const qId = qRes.data.data._id;

  const eRes = await apiCall('/exams', 'POST', {
    title: 'JS Exam Security Test',
    description: 'Verifying anti-cheat metrics tracking.',
    subject: 'JS Security',
    duration: 10,
    startTime: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    endTime: new Date(Date.now() + 600000).toISOString(),   // 10 minutes from now
    totalMarks: 2,
    questions: [qId]
  }, tToken);
  const examId = eRes.data.data._id;

  // Publish Exam
  await apiCall(`/exams/${examId}/publish`, 'PATCH', null, tToken);

  // 3. Start Exam as Student A
  console.log('\nStarting exam attempt as Student A...');
  const startRes = await apiCall('/submissions/start', 'POST', { examId }, saToken);
  const submissionId = startRes.data.data._id;
  console.log('Submission ID:', submissionId);

  // 4. Test Error - Update violations with negative count
  console.log('\n--- TEST A: Negative violations validation failure ---');
  const negRes = await apiCall(`/submissions/${submissionId}/violations`, 'PATCH', {
    tabSwitchCount: -1
  }, saToken);
  console.log('Status (should be 400):', negRes.status);
  console.log('Message:', negRes.data.message);
  console.log('Errors:', JSON.stringify(negRes.data.errors, null, 2));
  if (negRes.status !== 400 || negRes.data.success !== false) {
    throw new Error('Expected 400 on negative violation value');
  }

  // 5. Test Success - Update violations with valid values
  console.log('\n--- TEST B: Update violations with valid values (tabSwitchCount: 3, fullscreenExitCount: 1, copyPasteAttempts: 2) ---');
  const updateRes = await apiCall(`/submissions/${submissionId}/violations`, 'PATCH', {
    tabSwitchCount: 3,
    fullscreenExitCount: 1,
    copyPasteAttempts: 2
  }, saToken);
  console.log('Status (should be 200):', updateRes.status);
  console.log('Updated counts inside payload:', {
    tabSwitchCount: updateRes.data.data.tabSwitchCount,
    fullscreenExitCount: updateRes.data.data.fullscreenExitCount,
    copyPasteAttempts: updateRes.data.data.copyPasteAttempts
  });
  if (
    updateRes.status !== 200 ||
    updateRes.data.data.tabSwitchCount !== 3 ||
    updateRes.data.data.fullscreenExitCount !== 1 ||
    updateRes.data.data.copyPasteAttempts !== 2
  ) {
    throw new Error('Failed to update violations');
  }

  // 6. Test Error - Student B attempting to update Student A's violations
  console.log('\n--- TEST C: Cross-student violation update prevention (Student B -> Student A) ---');
  const badUpdateRes = await apiCall(`/submissions/${submissionId}/violations`, 'PATCH', {
    tabSwitchCount: 5
  }, sbToken);
  console.log('Status (should be 403):', badUpdateRes.status);
  console.log('Message:', badUpdateRes.data.message);
  if (badUpdateRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for cross-student update');
  }

  // 7. Test Error - Student B attempting to view Student A's submission
  console.log('\n--- TEST D: Cross-student submission retrieve prevention (Student B -> Student A) ---');
  const badViewRes = await apiCall(`/submissions/${submissionId}`, 'GET', null, sbToken);
  console.log('Status (should be 403):', badViewRes.status);
  console.log('Message:', badViewRes.data.message);
  if (badViewRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for cross-student retrieval');
  }

  // 8. Test Success - Student A retrieving own submission details
  console.log('\n--- TEST E: Student A retrieving own submission details ---');
  const saViewRes = await apiCall(`/submissions/${submissionId}`, 'GET', null, saToken);
  console.log('Status (should be 200):', saViewRes.status);
  console.log('Retrieved Violation Stats:', {
    tabSwitchCount: saViewRes.data.data.tabSwitchCount,
    fullscreenExitCount: saViewRes.data.data.fullscreenExitCount,
    copyPasteAttempts: saViewRes.data.data.copyPasteAttempts
  });
  if (saViewRes.status !== 200 || saViewRes.data.data.tabSwitchCount !== 3) {
    throw new Error('Student A failed to view own submission details');
  }

  // 9. Finalize exam attempt (Submit exam)
  console.log('\nSubmitting exam attempt...');
  await apiCall(`/submissions/${submissionId}/submit`, 'POST', null, saToken);

  // 10. Test Error - Trying to PATCH violations post-submission
  console.log('\n--- TEST F: Attempt to update violations post-submission ---');
  const postSubmitRes = await apiCall(`/submissions/${submissionId}/violations`, 'PATCH', {
    tabSwitchCount: 4
  }, saToken);
  console.log('Status (should be 400):', postSubmitRes.status);
  console.log('Message:', postSubmitRes.data.message);
  if (postSubmitRes.status !== 400) {
    throw new Error('Expected 400 Bad Request when updating violations post-submission');
  }

  // 11. Test Success - Teacher retrieving completed submission and viewing violations
  console.log('\n--- TEST G: Teacher retrieving submission to check violations ---');
  const teacherViewRes = await apiCall(`/submissions/${submissionId}`, 'GET', null, tToken);
  console.log('Status (should be 200):', teacherViewRes.status);
  console.log('Violations visible to Teacher:', {
    tabSwitchCount: teacherViewRes.data.data.tabSwitchCount,
    fullscreenExitCount: teacherViewRes.data.data.fullscreenExitCount,
    copyPasteAttempts: teacherViewRes.data.data.copyPasteAttempts
  });
  if (
    teacherViewRes.status !== 200 ||
    teacherViewRes.data.data.tabSwitchCount !== 3 ||
    teacherViewRes.data.data.fullscreenExitCount !== 1 ||
    teacherViewRes.data.data.copyPasteAttempts !== 2
  ) {
    throw new Error('Teacher failed to retrieve submission violations details');
  }

  // 12. Test Error - Unrelated Teacher (Teacher 2) trying to view Student A's submission
  console.log('\n--- TEST H: Unrelated teacher retrieval prevention (Teacher 2 -> Student A) ---');
  const t2ViewRes = await apiCall(`/submissions/${submissionId}`, 'GET', null, t2Token);
  console.log('Status (should be 403):', t2ViewRes.status);
  console.log('Message:', t2ViewRes.data.message);
  if (t2ViewRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for unrelated teacher query');
  }

  console.log('\n--- ALL EXAM SECURITY SYSTEM TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('EXAM SECURITY TEST FAILED:', err);
  process.exit(1);
});
