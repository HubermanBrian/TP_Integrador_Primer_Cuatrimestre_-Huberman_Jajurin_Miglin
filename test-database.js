const db = require('./db');

async function testDatabase() {
  console.log('🧪 Testing database connection and stored procedures...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing database connection...');
    const connected = await db.testConnection();
    console.log(`   ✅ Connection: ${connected ? 'SUCCESS' : 'FAILED'}\n`);

    if (!connected) {
      console.log('❌ Database connection failed. Please check your configuration.');
      return;
    }

    // Test 2: Test user registration stored procedure
    console.log('2. Testing user registration stored procedure...');
    try {
      const testUser = {
        username: 'testuser_' + Date.now(),
        password: 'hashedpassword123',
        first_name: 'Test',
        last_name: 'User'
      };

      const result = await db.query(
        'SELECT * FROM register_user($1, $2, $3, $4)',
        [testUser.username, testUser.password, testUser.first_name, testUser.last_name]
      );

      if (result.rows[0].success) {
        console.log(`   ✅ User registration: SUCCESS (User ID: ${result.rows[0].id})`);
      } else {
        console.log(`   ❌ User registration: FAILED - ${result.rows[0].message}`);
      }
    } catch (error) {
      console.log(`   ❌ User registration stored procedure error: ${error.message}`);
    }
    console.log('');

    // Test 3: Test events with details stored procedure
    console.log('3. Testing events with details stored procedure...');
    try {
      const result = await db.query('SELECT * FROM get_events_with_details(5, 0)');
      console.log(`   ✅ Events with details: SUCCESS (${result.rows.length} events found)`);
      
      if (result.rows.length > 0) {
        const firstEvent = result.rows[0];
        console.log(`   📋 Sample event: "${firstEvent.name}" at ${firstEvent.location_name}`);
      }
    } catch (error) {
      console.log(`   ❌ Events stored procedure error: ${error.message}`);
    }
    console.log('');

    // Test 4: Test event details by ID stored procedure
    console.log('4. Testing event details by ID stored procedure...');
    try {
      const result = await db.query('SELECT * FROM get_event_by_id(8)');
      if (result.rows.length > 0) {
        const event = result.rows[0];
        console.log(`   ✅ Event details: SUCCESS - "${event.name}"`);
        console.log(`   📍 Location: ${event.location_name}`);
        console.log(`   👥 Enrollments: ${event.enrollments_count}`);
      } else {
        console.log('   ⚠️  Event details: No event found with ID 8');
      }
    } catch (error) {
      console.log(`   ❌ Event details stored procedure error: ${error.message}`);
    }
    console.log('');

    // Test 5: Test basic queries
    console.log('5. Testing basic database queries...');
    try {
      const eventsCount = await db.query('SELECT COUNT(*) as count FROM events');
      const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
      const locationsCount = await db.query('SELECT COUNT(*) as count FROM event_locations');
      
      console.log(`   📊 Events: ${eventsCount.rows[0].count}`);
      console.log(`   👥 Users: ${usersCount.rows[0].count}`);
      console.log(`   📍 Event Locations: ${locationsCount.rows[0].count}`);
      console.log('   ✅ Basic queries: SUCCESS');
    } catch (error) {
      console.log(`   ❌ Basic queries error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    // Close the database connection
    await db.end();
    console.log('\n🏁 Database test completed.');
  }
}

// Run the test
testDatabase().catch(console.error); 