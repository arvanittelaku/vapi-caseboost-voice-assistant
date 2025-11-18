#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID; // Sarah's ID
const PHONE_NUMBER = process.argv[2];

async function makeTestCall(phoneNumber) {
  if (!phoneNumber) {
    console.error('❌ Please provide a phone number: node scripts/make-test-call.js +1234567890');
    process.exit(1);
  }

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  if (!VAPI_ASSISTANT_ID) {
    console.error('❌ VAPI_ASSISTANT_ID not found in environment variables');
    process.exit(1);
  }

  console.log(`\n📞 Initiating VAPI test call to ${phoneNumber}...\n`);

  try {
    const response = await axios.post(
      'https://api.vapi.ai/call/phone',
      {
        assistantId: VAPI_ASSISTANT_ID,
        customer: {
          number: phoneNumber
        },
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || null
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Call initiated successfully!');
    console.log('\n📋 Call Details:');
    console.log(`   - Call ID: ${response.data.id}`);
    console.log(`   - Status: ${response.data.status}`);
    console.log(`   - Assistant: Sarah (Primary Lead Qualifier)`);
    console.log(`   - Phone: ${phoneNumber}`);
    console.log('\n🎯 Test Scenarios:');
    console.log('   1. Say "We need SEO" → Should transfer to Samantha');
    console.log('   2. Say "We need a website redesign" → Should transfer to Whitney');
    console.log('   3. Say "We need a CRM" → Should transfer to Marcus');
    console.log('   4. Say "We need mass tort leads" → Should transfer to Taylor');
    console.log('   5. Say "We need Google Ads" → Should transfer to Peter');
    console.log('   6. Say "We need immediate leads" → Should transfer to Paula');
    console.log('   7. Say "We need AI intake" → Should transfer to Alex');
    console.log('   8. Say "We\'re a medical malpractice firm" → Should transfer to Patricia');
    console.log('\n⏳ The phone should ring shortly...\n');

    return response.data;

  } catch (error) {
    console.error('❌ Failed to initiate call:');
    if (error.response) {
      console.error(`   - Status: ${error.response.status}`);
      console.error(`   - Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   - Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Execute
makeTestCall(PHONE_NUMBER);


