#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacd1f6'; // Your Case Boost Squad ID

async function enableRollingHistory() {
  console.log('🔄 Enabling Rolling History for Case Boost Squad...\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    console.error('Please add VAPI_API_KEY to your .env file');
    process.exit(1);
  }

  try {
    console.log('📋 Fetching current squad configuration...');
    
    // GET the squad first
    const getResponse = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Squad configuration retrieved!');
    console.log('\n📊 Current Squad Config:');
    console.log(JSON.stringify(getResponse.data, null, 2));

    console.log('\n🔄 Now updating with rolling history...');

    // UPDATE the squad with PUT
    const updateResponse = await axios.put(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        ...getResponse.data,
        members: getResponse.data.members,
        contextMode: 'rolling-history'
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS! Rolling history enabled for Case Boost Squad');
    console.log(`\n📊 Updated Squad Configuration:`);
    console.log(JSON.stringify(updateResponse.data, null, 2));
    console.log('\n🎉 Context will now be passed seamlessly between assistants!');

  } catch (error) {
    console.error('\n❌ Failed to enable rolling history:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 404) {
        console.error('\n💡 The squad endpoint might not exist in your VAPI version.');
        console.error('   Rolling history might already be enabled by default, OR');
        console.error('   Contact VAPI support to enable it: support@vapi.ai');
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

enableRollingHistory();
