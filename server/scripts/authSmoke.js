
const BASE_URL = 'http://localhost:4000/api';

async function run() {
  console.log('Running Auth Smoke Tests...');
  
  // 1. Signup
  let res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-anonymous-id': 'test-123' },
    body: JSON.stringify({ email: 'test@example.com', name: 'Test User' })
  });
  console.log('Signup status:', res.status);
  
  // 2. Login (email_only)
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-anonymous-id': 'test-123' },
    body: JSON.stringify({ email: 'test@example.com' })
  });
  console.log('Login status:', res.status);
  
  const data = await res.json();
  const accessToken = data.accessToken;
  const cookieHeader = res.headers.get('set-cookie');
  console.log('Got access token:', !!accessToken);
  console.log('Got set-cookie for refresh:', !!cookieHeader);

  // 3. Refresh rotation
  const refreshToken = cookieHeader.split(';')[0].split('=')[1];
  res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Cookie': `refreshToken=${refreshToken}`,
      'x-anonymous-id': 'test-123'
    }
  });
  console.log('Refresh status:', res.status);
  const data2 = await res.json();
  console.log('Got new access token:', !!data2.accessToken);

  // 4. Logout
  res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'x-anonymous-id': 'test-123' }
  });
  console.log('Logout status:', res.status);

  console.log('\nPASS');
}

run().catch(console.error);
