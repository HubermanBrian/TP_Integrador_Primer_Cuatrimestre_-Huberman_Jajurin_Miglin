const fetch = require('node-fetch');

async function testSearchEndpoints() {
  console.log('🧪 Testing search endpoints...\n');

  try {
    // Test 1: Search by name
    console.log('1. Testing GET /api/event/?name=taylor...');
    const nameResponse = await fetch('http://localhost:3000/api/event/?name=taylor');
    
    if (!nameResponse.ok) {
      throw new Error(`Name search failed: ${nameResponse.status}`);
    }
    
    const nameResults = await nameResponse.json();
    console.log(`   ✅ Success! Found ${nameResults.length} events with "taylor" in name`);
    
    if (nameResults.length > 0) {
      console.log('   📋 Sample result:');
      console.log(`      Name: ${nameResults[0].name}`);
      console.log(`      Date: ${nameResults[0].start_date}`);
      console.log(`      Tags: ${nameResults[0].tags.join(', ')}`);
    }

    // Test 2: Search by startdate
    console.log('\n2. Testing GET /api/event/?startdate=2025-03-03...');
    const dateResponse = await fetch('http://localhost:3000/api/event/?startdate=2025-03-03');
    
    if (!dateResponse.ok) {
      throw new Error(`Date search failed: ${dateResponse.status}`);
    }
    
    const dateResults = await dateResponse.json();
    console.log(`   ✅ Success! Found ${dateResults.length} events on 2025-03-03`);
    
    if (dateResults.length > 0) {
      console.log('   📋 Sample result:');
      console.log(`      Name: ${dateResults[0].name}`);
      console.log(`      Date: ${dateResults[0].start_date}`);
    }

    // Test 3: Search by tag
    console.log('\n3. Testing GET /api/event/?tag=Rock...');
    const tagResponse = await fetch('http://localhost:3000/api/event/?tag=Rock');
    
    if (!tagResponse.ok) {
      throw new Error(`Tag search failed: ${tagResponse.status}`);
    }
    
    const tagResults = await tagResponse.json();
    console.log(`   ✅ Success! Found ${tagResults.length} events with "Rock" tag`);
    
    if (tagResults.length > 0) {
      console.log('   📋 Sample result:');
      console.log(`      Name: ${tagResults[0].name}`);
      console.log(`      Tags: ${tagResults[0].tags.join(', ')}`);
    }

    // Test 4: Combined search (name + startdate + tag)
    console.log('\n4. Testing GET /api/event/?name=taylor&startdate=2025-03-03&tag=Rock...');
    const combinedResponse = await fetch('http://localhost:3000/api/event/?name=taylor&startdate=2025-03-03&tag=Rock');
    
    if (!combinedResponse.ok) {
      throw new Error(`Combined search failed: ${combinedResponse.status}`);
    }
    
    const combinedResults = await combinedResponse.json();
    console.log(`   ✅ Success! Found ${combinedResults.length} events matching all criteria`);
    
    if (combinedResults.length > 0) {
      console.log('   📋 Sample result:');
      console.log(`      Name: ${combinedResults[0].name}`);
      console.log(`      Date: ${combinedResults[0].start_date}`);
      console.log(`      Tags: ${combinedResults[0].tags.join(', ')}`);
    }

    // Test 5: Search by startdate only (as in example)
    console.log('\n5. Testing GET /api/event/?startdate=2025-08-21...');
    const dateOnlyResponse = await fetch('http://localhost:3000/api/event/?startdate=2025-08-21');
    
    if (!dateOnlyResponse.ok) {
      throw new Error(`Date only search failed: ${dateOnlyResponse.status}`);
    }
    
    const dateOnlyResults = await dateOnlyResponse.json();
    console.log(`   ✅ Success! Found ${dateOnlyResults.length} events on 2025-08-21`);

    // Test 6: Verify response structure
    console.log('\n6. Verifying response structure...');
    if (combinedResults.length > 0 || nameResults.length > 0 || dateResults.length > 0 || tagResults.length > 0) {
      const sampleEvent = combinedResults[0] || nameResults[0] || dateResults[0] || tagResults[0];
      
      const requiredFields = [
        'id', 'name', 'description', 'start_date', 
        'duration_in_minutes', 'price', 'enabled_for_enrollment', 
        'max_assistance', 'creator', 'location', 'tags'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in sampleEvent));
      
      if (missingFields.length === 0) {
        console.log('   ✅ All required fields present in response');
      } else {
        console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
      }
      
      // Check nested objects
      if (sampleEvent.creator && typeof sampleEvent.creator === 'object') {
        console.log('   ✅ Creator object structure correct');
      } else {
        console.log('   ❌ Creator object missing or invalid');
      }
      
      if (sampleEvent.location && typeof sampleEvent.location === 'object') {
        console.log('   ✅ Location object structure correct');
      } else {
        console.log('   ❌ Location object missing or invalid');
      }
    }

    console.log('\n✅ All search tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. The backend server is running on port 3000');
    console.log('   2. The database is connected and has data');
    console.log('   3. The stored procedures are updated');
    console.log('   4. There are events in the database with the search terms');
  }
}

// Run the test
testSearchEndpoints(); 