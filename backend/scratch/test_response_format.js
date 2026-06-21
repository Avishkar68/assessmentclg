const URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING RESPONSE FORMAT VERIFICATION ---');

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

  // 1. Success Health Check Response
  console.log('\n1. Checking Health Check success format...');
  const healthRes = await apiCall('/health');
  console.log('Status:', healthRes.status);
  console.log('Payload:', JSON.stringify(healthRes.data, null, 2));
  if (healthRes.data.success !== true || !healthRes.data.message || !healthRes.data.data) {
    throw new Error('Health Check response format does not match!');
  }

  // 2. Error Response - Register Validation Error
  console.log('\n2. Checking Register Validation error format...');
  const regErrRes = await apiCall('/auth/register', 'POST', {
    name: '',
    email: 'invalidemail',
    password: '123'
  });
  console.log('Status:', regErrRes.status);
  console.log('Payload:', JSON.stringify(regErrRes.data, null, 2));
  if (regErrRes.data.success !== false || !regErrRes.data.message || !Array.isArray(regErrRes.data.errors)) {
    throw new Error('Register validation error response format does not match!');
  }

  // 3. Success Response - Valid Register
  const ts = Date.now();
  const email = `format_${ts}@example.com`;
  console.log(`\n3. Checking User Register success format with email: ${email}...`);
  const regSuccessRes = await apiCall('/auth/register', 'POST', {
    name: 'Format User',
    email,
    password: 'password123',
    role: 'teacher'
  });
  console.log('Status:', regSuccessRes.status);
  console.log('Payload:', JSON.stringify(regSuccessRes.data, null, 2));
  if (regSuccessRes.data.success !== true || !regSuccessRes.data.message || !regSuccessRes.data.data.token || !regSuccessRes.data.data.user) {
    throw new Error('Register success response format does not match!');
  }

  const token = regSuccessRes.data.data.token;

  // 4. Success Response - User Profile (getMe)
  console.log('\n4. Checking Get Me profile success format...');
  const meRes = await apiCall('/auth/me', 'GET', null, token);
  console.log('Status:', meRes.status);
  console.log('Payload:', JSON.stringify(meRes.data, null, 2));
  if (meRes.data.success !== true || !meRes.data.message || !meRes.data.data.user) {
    throw new Error('Profile response format does not match!');
  }

  // 5. Success Response - Create Question
  console.log('\n5. Checking Create Question success format...');
  const qCreateRes = await apiCall('/questions', 'POST', {
    type: 'MCQ',
    questionText: 'Is this format consistent?',
    options: ['Yes', 'No'],
    correctAnswer: 'Yes',
    difficulty: 'Easy',
    subject: 'API Testing',
    chapter: 'Refactoring',
    marks: 5
  }, token);
  console.log('Status:', qCreateRes.status);
  console.log('Payload:', JSON.stringify(qCreateRes.data, null, 2));
  if (qCreateRes.data.success !== true || !qCreateRes.data.message || !qCreateRes.data.data._id) {
    throw new Error('Question creation response format does not match!');
  }

  // 6. Success Response - Get Questions List
  console.log('\n6. Checking Get Questions List success format...');
  const qListRes = await apiCall('/questions', 'GET', null, token);
  console.log('Status:', qListRes.status);
  console.log('Payload:', JSON.stringify(qListRes.data, null, 2));
  if (qListRes.data.success !== true || !qListRes.data.message || typeof qListRes.data.data.count !== 'number' || !Array.isArray(qListRes.data.data.questions)) {
    throw new Error('Question list response format does not match!');
  }

  // 7. Operational Error - Not Found Question
  console.log('\n7. Checking Not Found Question error format...');
  const qNotFoundRes = await apiCall('/questions/607f1f77bcf86cd799439011', 'GET', null, token);
  console.log('Status:', qNotFoundRes.status);
  console.log('Payload:', JSON.stringify(qNotFoundRes.data, null, 2));
  if (qNotFoundRes.data.success !== false || !qNotFoundRes.data.message || !Array.isArray(qNotFoundRes.data.errors)) {
    throw new Error('Question not found response format does not match!');
  }

  console.log('\n--- ALL RESPONSE FORMATS MATCH EXPECTED DESIGN SPECIFICATIONS ---');
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
