#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Squad and Assistant IDs
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacd1f6';
const SARAH_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

async function setSquadDefaultAssistant() {
  console.log('🚀 Setting Sarah as Squad\'s default assistant...\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    // First, get current squad configuration
    console.log('📥 Fetching current squad configuration...');
    const currentConfig = await axios.get(
      `${VAPI_BASE_URL}/squad/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    console.log('✅ Current config fetched\n');
    console.log('Current squad structure:', JSON.stringify(currentConfig.data, null, 2));

    // Update squad with Sarah as default/first assistant
    console.log('\n📝 Updating squad with Sarah as default assistant...');
    
    const updatePayload = {
      defaultAssistantId: SARAH_ID
    };

    const response = await axios.patch(
      `${VAPI_BASE_URL}/squad/${SQUAD_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Squad updated successfully!\n');
    console.log('📋 Sarah is now the default assistant for all squad calls\n');
    console.log('🎯 Result: All calls will now show "Sarah" in call logs\n');

  } catch (error) {
    console.error('❌ Failed to update squad:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 404) {
        console.error('\n💡 The squad endpoint might not support this property.');
        console.error('   Please configure the default assistant in the VAPI dashboard:');
        console.error('   1. Go to Squads → Case Boost Squad');
        console.error('   2. Look for "Default Assistant" or "First Member" setting');
        console.error('   3. Set it to: Sarah');
        console.error('   4. Save\n');
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the configuration
setSquadDefaultAssistant();

