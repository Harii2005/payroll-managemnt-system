const fetch = require('node-fetch');

async function testRegistration() {
  try {
    const testData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!',
      department: 'IT',
      position: 'Developer',
      employeeId: 'EMP001',
      role: 'employee'
    };

    console.log('Testing registration endpoint...');
    console.log('Data being sent:', testData);

    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed');
    }

  } catch (error) {
    console.error('Error testing registration:', error.message);
  }
}

testRegistration();
