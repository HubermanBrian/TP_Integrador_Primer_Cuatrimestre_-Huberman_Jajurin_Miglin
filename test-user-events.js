const fetch = require('node-fetch');

async function testUserEvents() {
  console.log('🧪 Testing user events endpoints...\n');

  try {
    // First, we need to login to get a token
    console.log('1. Logging in to get authentication token...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'pablo.ulman@ort.edu.ar', // Using an existing user from the database
        password: 'pabulm101'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('   ✅ Login successful, token obtained');

    // Test 2: Get user's created events
    console.log('\n2. Testing GET /api/users/me/events/created...');
    const createdEventsResponse = await fetch('http://localhost:3000/api/users/me/events/created', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!createdEventsResponse.ok) {
      throw new Error(`Created events request failed: ${createdEventsResponse.status}`);
    }

    const createdEvents = await createdEventsResponse.json();
    console.log(`   ✅ Success! User has ${createdEvents.length} created events`);

    if (createdEvents.length > 0) {
      console.log('   📋 Sample created event:');
      console.log(JSON.stringify(createdEvents[0], null, 2));
    }

    // Test 3: Get user's joined events
    console.log('\n3. Testing GET /api/users/me/events/joined...');
    const joinedEventsResponse = await fetch('http://localhost:3000/api/users/me/events/joined', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!joinedEventsResponse.ok) {
      throw new Error(`Joined events request failed: ${joinedEventsResponse.status}`);
    }

    const joinedEvents = await joinedEventsResponse.json();
    console.log(`   ✅ Success! User has ${joinedEvents.length} joined events`);

    if (joinedEvents.length > 0) {
      console.log('   📋 Sample joined event:');
      console.log(JSON.stringify(joinedEvents[0], null, 2));
    }

    // Test 4: Test without authentication
    console.log('\n4. Testing without authentication (should fail)...');
    const noAuthResponse = await fetch('http://localhost:3000/api/users/me/events/created');
    
    if (noAuthResponse.status === 401) {
      console.log('   ✅ Correctly rejected request without authentication');
    } else {
      console.log('   ❌ Should have rejected request without authentication');
    }

    console.log('\n✅ All user events tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. The backend server is running on port 3000');
    console.log('   2. The database is connected and has data');
    console.log('   3. The user exists in the database');
    console.log('   4. The authentication middleware is working');
  }
}

// Run the test
testUserEvents(); 