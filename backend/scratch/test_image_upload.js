const URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING IMAGE UPLOAD SYSTEM TESTS ---');

  // Helper for standard JSON calls
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

  // 1. Create a teacher to obtain auth token
  const ts = Date.now();
  const teacherEmail = `t_upload_${ts}@example.com`;
  console.log(`\nRegistering teacher: ${teacherEmail}...`);
  const regRes = await apiCall('/auth/register', 'POST', {
    name: 'Upload Teacher',
    email: teacherEmail,
    password: 'password123',
    role: 'teacher'
  });
  const token = regRes.data.data.token;

  // 2. Test Error - No file provided
  console.log('\n--- TEST A: Uploading no file ---');
  const noFileRes = await fetch(`${URL}/uploads/question-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const noFileData = await noFileRes.json();
  console.log('Status (should be 400):', noFileRes.status);
  console.log('Payload:', JSON.stringify(noFileData, null, 2));
  if (noFileRes.status !== 400 || noFileData.success !== false) {
    throw new Error('Expected 400 Bad Request on empty upload');
  }

  // 3. Test Error - Unsupported file type (.txt file)
  console.log('\n--- TEST B: Uploading unsupported format (.txt file) ---');
  const txtFormData = new FormData();
  const txtBlob = new Blob([Buffer.from('Hello world')], { type: 'text/plain' });
  txtFormData.append('image', txtBlob, 'test.txt');

  const badTypeRes = await fetch(`${URL}/uploads/question-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: txtFormData
  });
  const badTypeData = await badTypeRes.json();
  console.log('Status (should be 400):', badTypeRes.status);
  console.log('Payload:', JSON.stringify(badTypeData, null, 2));
  if (badTypeRes.status !== 400 || !badTypeData.message.includes('Only JPG, JPEG, PNG, and WEBP')) {
    throw new Error('Expected 400 Bad Request on unsupported file type');
  }

  // 4. Test Error - File size limit exceeded (exceeds 2MB limit)
  console.log('\n--- TEST C: Uploading file exceeding size limit (2.1 MB) ---');
  const hugeBuffer = Buffer.alloc(2.1 * 1024 * 1024); // 2.1 MB of zeros
  const hugeFormData = new FormData();
  const hugeBlob = new Blob([hugeBuffer], { type: 'image/png' });
  hugeFormData.append('image', hugeBlob, 'huge.png');

  const sizeRes = await fetch(`${URL}/uploads/question-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: hugeFormData
  });
  const sizeData = await sizeRes.json();
  console.log('Status (should be 400):', sizeRes.status);
  console.log('Payload:', JSON.stringify(sizeData, null, 2));
  if (sizeRes.status !== 400 || !sizeData.message.includes('size limit exceeded')) {
    throw new Error('Expected 400 Bad Request on file size limit violation');
  }

  // 5. Test Success - Uploading a valid mock 1x1 PNG image
  console.log('\n--- TEST D: Uploading a valid mock 1x1 PNG image ---');
  const png1x1B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(png1x1B64, 'base64');
  const validFormData = new FormData();
  const validBlob = new Blob([pngBuffer], { type: 'image/png' });
  validFormData.append('image', validBlob, 'mock1x1.png');

  const uploadRes = await fetch(`${URL}/uploads/question-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: validFormData
  });
  const uploadData = await uploadRes.json();
  console.log('Status (should be 200):', uploadRes.status);
  console.log('Payload:', JSON.stringify(uploadData, null, 2));
  if (uploadRes.status !== 200 || !uploadData.data.imageUrl) {
    throw new Error('Image upload failed');
  }

  const imageUrl = uploadData.data.imageUrl;

  // 6. Test Success - Create Question storing this image URL
  console.log('\n--- TEST E: Creating question with uploaded image URL ---');
  const qRes = await apiCall('/questions', 'POST', {
    type: 'Short Answer',
    questionText: 'What color is the sky?',
    expectedAnswer: 'Blue',
    difficulty: 'Easy',
    subject: 'General Knowledge',
    chapter: 'Sky Color',
    marks: 2,
    questionImage: imageUrl
  }, token);

  console.log('Status (should be 201):', qRes.status);
  console.log('Payload:', JSON.stringify(qRes.data, null, 2));
  if (qRes.status !== 201 || qRes.data.data.questionImage !== imageUrl) {
    throw new Error('Failed to create question with image URL');
  }

  // 7. Verify question retrieval includes the URL
  console.log('\n--- TEST F: Fetching question details ---');
  const detailRes = await apiCall(`/questions/${qRes.data.data._id}`, 'GET', null, token);
  console.log('Status (should be 200):', detailRes.status);
  console.log('Question Image in DB:', detailRes.data.data.questionImage);
  if (detailRes.data.data.questionImage !== imageUrl) {
    throw new Error('Question retrieved from database lacks correct image URL');
  }

  console.log('\n--- ALL IMAGE UPLOAD SYSTEM TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('IMAGE UPLOAD TEST FAILED:', err);
  process.exit(1);
});
