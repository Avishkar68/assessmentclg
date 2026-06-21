const XLSX = require('xlsx');
const URL = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING QUESTION UPLOAD TEMPLATES TESTS ---');

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

  // 1. Setup User
  const ts = Date.now();
  const teacherEmail = `t_temp_${ts}@example.com`;
  console.log(`\nRegistering teacher: ${teacherEmail}...`);
  const tReg = await apiCall('/auth/register', 'POST', { name: 'Template Teacher', email: teacherEmail, password: 'password123', role: 'teacher' });
  const token = tReg.data.data.token;

  // 2. Test Excel Template Download
  console.log('\n--- TEST A: Downloading and validating Excel template ---');
  const excelRes = await fetch(`${URL}/questions/template/excel`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status (should be 200):', excelRes.status);
  const excelContentType = excelRes.headers.get('content-type');
  const excelContentDisposition = excelRes.headers.get('content-disposition');
  console.log('Content-Type Header:', excelContentType);
  console.log('Content-Disposition Header:', excelContentDisposition);

  if (excelRes.status !== 200) {
    throw new Error('Failed to download Excel template');
  }
  if (!excelContentType || !excelContentType.includes('spreadsheetml')) {
    throw new Error('Invalid Content-Type for Excel template');
  }
  if (!excelContentDisposition || !excelContentDisposition.includes('questions_template.xlsx')) {
    throw new Error('Invalid filename in Content-Disposition for Excel template');
  }

  // Parse excel buffer to verify contents
  const arrayBuffer = await excelRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  console.log('Sheet Name:', sheetName);
  
  if (sheetName !== 'Question Template') {
    throw new Error('Unexpected sheet name inside template workbook');
  }

  const worksheet = workbook.Sheets[sheetName];
  const parsedRows = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  console.log('Parsed Excel rows count:', parsedRows.length);
  console.log('First parsed row:', JSON.stringify(parsedRows[0], null, 2));

  if (parsedRows.length !== 2) {
    throw new Error('Expected exactly 2 sample rows in Excel template');
  }

  const expectedHeaders = ['type', 'questionText', 'questionImage', 'difficulty', 'subject', 'chapter', 'marks', 'options', 'correctAnswer', 'expectedAnswer'];
  const firstRowKeys = Object.keys(parsedRows[0]);
  console.log('Headers found in row 1:', firstRowKeys);

  // 3. Test CSV Template Download
  console.log('\n--- TEST B: Downloading and validating CSV template ---');
  const csvRes = await fetch(`${URL}/questions/template/csv`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log('Status (should be 200):', csvRes.status);
  const csvContentType = csvRes.headers.get('content-type');
  const csvContentDisposition = csvRes.headers.get('content-disposition');
  console.log('Content-Type Header:', csvContentType);
  console.log('Content-Disposition Header:', csvContentDisposition);

  if (csvRes.status !== 200) {
    throw new Error('Failed to download CSV template');
  }
  if (!csvContentType || !csvContentType.includes('text/csv')) {
    throw new Error('Invalid Content-Type for CSV template');
  }
  if (!csvContentDisposition || !csvContentDisposition.includes('questions_template.csv')) {
    throw new Error('Invalid filename in Content-Disposition for CSV template');
  }

  const csvText = await csvRes.text();
  console.log('First 200 chars of CSV text:\n', csvText.substring(0, 200));

  // Check header row in CSV
  const csvLines = csvText.split('\n');
  const csvHeaders = csvLines[0].split(',').map(h => h.trim());
  console.log('CSV Headers parsed:', csvHeaders);

  console.log('\n--- ALL TEMPLATE DOWNLOAD TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('TEMPLATE DOWNLOAD TEST FAILED:', err);
  process.exit(1);
});
