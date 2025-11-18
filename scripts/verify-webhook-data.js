#!/usr/bin/env node

/**
 * Webhook Data Verification Script
 * 
 * This script helps you verify that your GHL webhook is correctly
 * sending data to the VAPI squad and that the data is accessible
 * during calls.
 * 
 * Usage: node scripts/verify-webhook-data.js
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Your Squad and Phone Number IDs
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacd1f6';
const PHONE_NUMBER_ID = '21a417c0-ef45-41dc-a5fa-e02207fb9dad';

/**
 * Make a test call with sample form data to verify data passing
 */
async function makeTestCallWithData(testPhoneNumber) {
  console.log('🧪 Making test call with sample form data...\n');

  // Sample data that mimics what GHL would send
  const testCallPayload = {
    assistantId: SQUAD_ID,
    customer: {
      number: testPhoneNumber,
      name: "John Smith",
      email: "john.smith@lawfirm.com"
    },
    phoneNumberId: PHONE_NUMBER_ID,
    assistantOverrides: {
      variableValues: {
        contact_name: "John",
        contact_source: "Website Form Submission - TEST",
        test_timestamp: new Date().toISOString()
      },
      firstMessage: "Hi John, this is Sarah from CaseBoost. This is a TEST CALL to verify data passing. Can you confirm you hear me?"
    }
  };

  console.log('📋 Test Call Configuration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Squad ID:', SQUAD_ID);
  console.log('Phone Number:', testPhoneNumber);
  console.log('Customer Name:', testCallPayload.customer.name);
  console.log('Variables Being Sent:');
  console.log(JSON.stringify(testCallPayload.assistantOverrides.variableValues, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await axios.post(
      `${VAPI_BASE_URL}/call/phone`,
      testCallPayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Call initiated successfully!\n');
    console.log('📞 Call ID:', response.data.id);
    console.log('📋 Call Status:', response.data.status);
    
    return response.data.id;

  } catch (error) {
    console.error('❌ Failed to initiate call:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

/**
 * Get call details to verify data was received
 */
async function verifyCallData(callId) {
  console.log('\n🔍 Fetching call details to verify data...\n');

  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/call/${callId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    const call = response.data;

    console.log('📊 Call Data Verification:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Call ID:', call.id);
    console.log('Status:', call.status);
    console.log('Assistant Used:', call.assistant?.name || call.assistantId);
    console.log('Customer Number:', call.customer?.number);
    console.log('Customer Name:', call.customer?.name);
    
    if (call.assistantOverrides?.variableValues) {
      console.log('\n✅ Variables Received by Squad:');
      console.log(JSON.stringify(call.assistantOverrides.variableValues, null, 2));
    } else {
      console.log('\n⚠️  No variable values found in call data');
    }

    if (call.messages && call.messages.length > 0) {
      console.log('\n💬 First Message Used:');
      console.log(call.messages[0].content);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return call;

  } catch (error) {
    console.error('❌ Failed to fetch call data:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

/**
 * Get recent calls to check data passing
 */
async function getRecentCalls(limit = 5) {
  console.log('📋 Fetching recent calls to verify data passing...\n');

  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/call`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        },
        params: {
          limit: limit,
          assistantId: SQUAD_ID
        }
      }
    );

    const calls = response.data;

    if (!calls || calls.length === 0) {
      console.log('⚠️  No recent calls found for this squad\n');
      return;
    }

    console.log(`📊 Last ${calls.length} Squad Calls:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    calls.forEach((call, index) => {
      console.log(`\n${index + 1}. Call ID: ${call.id}`);
      console.log(`   Status: ${call.status}`);
      console.log(`   Customer: ${call.customer?.name || 'N/A'} (${call.customer?.number})`);
      console.log(`   Started: ${call.startedAt ? new Date(call.startedAt).toLocaleString() : 'N/A'}`);
      console.log(`   Duration: ${call.endedAt ? Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000) + 's' : 'In progress'}`);
      
      if (call.assistantOverrides?.variableValues) {
        console.log(`   ✅ Variables: ${Object.keys(call.assistantOverrides.variableValues).length} fields passed`);
        console.log(`      ${JSON.stringify(call.assistantOverrides.variableValues, null, 6).replace(/\n/g, '\n      ')}`);
      } else {
        console.log(`   ⚠️  Variables: None`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Failed to fetch calls:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Check squad configuration
 */
async function checkSquadConfig() {
  console.log('🔍 Checking Squad Configuration...\n');

  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/squad/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    const squad = response.data;

    console.log('📊 Squad Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Squad ID:', squad.id);
    console.log('Squad Name:', squad.name || 'Unnamed Squad');
    console.log('Default Assistant:', squad.defaultAssistantId || 'Not set');
    
    if (squad.members && squad.members.length > 0) {
      console.log(`\n👥 Squad Members (${squad.members.length}):`);
      squad.members.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.assistantId}${member.assistantId === squad.defaultAssistantId ? ' (DEFAULT)' : ''}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Failed to fetch squad config:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 VAPI SQUAD WEBHOOK DATA VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    console.log('\n💡 Make sure you have a .env file with:');
    console.log('   VAPI_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0];
  const phoneNumber = args[1];

  if (command === 'test' && phoneNumber) {
    // Make a test call with sample data
    console.log('🎯 Mode: Test Call with Sample Data\n');
    const callId = await makeTestCallWithData(phoneNumber);
    
    if (callId) {
      console.log('\n⏳ Waiting 5 seconds for call to initialize...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await verifyCallData(callId);
      
      console.log('\n📝 WHAT TO CHECK:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('1. ✅ Did you receive the call?');
      console.log('2. ✅ Did Sarah say "Hi John"? (using the name)');
      console.log('3. ✅ Did she mention "TEST CALL"?');
      console.log('4. ✅ Check VAPI dashboard - do you see the variables?');
      console.log('\nIf YES to all → Your webhook data passing works! ✅');
      console.log('If NO → Check the error messages above\n');
    }

  } else if (command === 'recent') {
    // Check recent calls
    console.log('🎯 Mode: Recent Calls Analysis\n');
    await getRecentCalls(parseInt(args[1]) || 5);

  } else if (command === 'squad') {
    // Check squad configuration
    console.log('🎯 Mode: Squad Configuration Check\n');
    await checkSquadConfig();

  } else if (command === 'call' && phoneNumber) {
    // Check specific call by ID
    console.log('🎯 Mode: Specific Call Verification\n');
    await verifyCallData(phoneNumber);

  } else {
    // Show usage
    console.log('📖 Usage:\n');
    console.log('1. Test webhook data passing:');
    console.log('   node scripts/verify-webhook-data.js test +1234567890\n');
    console.log('2. Check recent calls:');
    console.log('   node scripts/verify-webhook-data.js recent [limit]\n');
    console.log('3. Check squad configuration:');
    console.log('   node scripts/verify-webhook-data.js squad\n');
    console.log('4. Check specific call:');
    console.log('   node scripts/verify-webhook-data.js call [call-id]\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

main();

