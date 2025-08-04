const fetch = require('node-fetch');

async function testEventsEndpoint() {
  console.log('🧪 Testing GET /api/event/ endpoint...\n');

  try {
    // Test 1: Basic endpoint call
    console.log('1. Testing basic endpoint call...');
    const response = await fetch('http://localhost:3000/api/event/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const events = await response.json();
    console.log(`   ✅ Success! Received ${events.length} events`);
    
    // Test 2: Check if events have required fields
    if (events.length > 0) {
      console.log('\n2. Checking required fields in first event...');
      const firstEvent = events[0];
      
      const requiredFields = [
        'id', 'name', 'description', 'start_date', 
        'duration_in_minutes', 'price', 'enabled_for_enrollment', 
        'max_assistance', 'creator', 'location'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in firstEvent));
      
      if (missingFields.length === 0) {
        console.log('   ✅ All required fields present');
      } else {
        console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
      }
      
      // Test 3: Check nested objects
      console.log('\n3. Checking nested objects structure...');
      
      if (firstEvent.creator && typeof firstEvent.creator === 'object') {
        const creatorFields = ['id', 'username', 'first_name', 'last_name', 'email'];
        const missingCreatorFields = creatorFields.filter(field => !(field in firstEvent.creator));
        
        if (missingCreatorFields.length === 0) {
          console.log('   ✅ Creator object structure correct');
        } else {
          console.log(`   ❌ Missing creator fields: ${missingCreatorFields.join(', ')}`);
        }
      } else {
        console.log('   ❌ Creator object missing or invalid');
      }
      
      if (firstEvent.location && typeof firstEvent.location === 'object') {
        const locationFields = ['name', 'address', 'latitude', 'longitude'];
        const missingLocationFields = locationFields.filter(field => !(field in firstEvent.location));
        
        if (missingLocationFields.length === 0) {
          console.log('   ✅ Location object structure correct');
        } else {
          console.log(`   ❌ Missing location fields: ${missingLocationFields.join(', ')}`);
        }
      } else {
        console.log('   ❌ Location object missing or invalid');
      }
      
      // Test 4: Check pagination
      console.log('\n4. Testing pagination...');
      const paginatedResponse = await fetch('http://localhost:3000/api/event/?limit=5&offset=0');
      const paginatedEvents = await paginatedResponse.json();
      
      if (paginatedEvents.length <= 5) {
        console.log('   ✅ Pagination working (limit=5)');
      } else {
        console.log('   ❌ Pagination not working correctly');
      }
      
      // Test 5: Show sample event
      console.log('\n5. Sample event structure:');
      console.log(JSON.stringify(firstEvent, null, 2));
      
    } else {
      console.log('   ⚠️  No events found in database');
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. The backend server is running on port 3000');
    console.log('   2. The database is connected and has data');
    console.log('   3. The stored procedures are created');
  }
}

// Run the test
testEventsEndpoint(); 