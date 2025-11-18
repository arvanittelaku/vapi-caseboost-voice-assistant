#!/usr/bin/env node
/**
 * Check and Update Phone Number Server URL
 * Verifies phone number configuration and updates if needed
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const EXPECTED_SERVER_URL = `${RENDER_URL}/webhook/vapi`;

async function listPhoneNumbers() {
  try {
    console.log('📞 Fetching phone numbers from VAPI...\n');
    
    const response = await axios.get(
      `${VAPI_BASE_URL}/phone-number`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const phoneNumbers = response.data;
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log('⚠️  No phone numbers found in your VAPI account\n');
      return [];
    }
    
    console.log(`✅ Found ${phoneNumbers.length} phone number(s):\n`);
    
    phoneNumbers.forEach((phone, index) => {
      console.log(`${index + 1}. Phone Number: ${phone.number || phone.phoneNumber || 'N/A'}`);
      console.log(`   ID: ${phone.id}`);
      console.log(`   Server URL: ${phone.serverUrl || 'NOT SET'}`);
      console.log(`   Status: ${phone.serverUrl === EXPECTED_SERVER_URL ? '✅ CORRECT' : phone.serverUrl ? '❌ WRONG' : '⚠️  NOT SET'}`);
      console.log('');
    });
    
    return phoneNumbers;
  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error.response?.data || error.message);
    return [];
  }
}

async function updatePhoneNumberServerUrl(phoneNumberId) {
  try {
    console.log(`\n🔧 Updating phone number ${phoneNumberId}...\n`);
    
    // First, get current phone number config
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/phone-number/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const currentPhone = getResponse.data;
    console.log(`Current Server URL: ${currentPhone.serverUrl || 'NOT SET'}`);
    console.log(`New Server URL: ${EXPECTED_SERVER_URL}\n`);
    
    // Update the server URL
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/phone-number/${phoneNumberId}`,
      {
        serverUrl: EXPECTED_SERVER_URL
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Phone number server URL updated successfully!');
    console.log(`   New Server URL: ${updateResponse.data.serverUrl}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating phone number:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📞 Phone Number Configuration Check');
  console.log('='.repeat(80));
  console.log(`\nExpected Server URL: ${EXPECTED_SERVER_URL}\n`);
  
  const phoneNumbers = await listPhoneNumbers();
  
  if (phoneNumbers.length === 0) {
    console.log('⚠️  No phone numbers to check. Please add a phone number in VAPI dashboard.\n');
    return;
  }
  
  // Check if any phone numbers need updating
  const needsUpdate = phoneNumbers.filter(phone => 
    !phone.serverUrl || phone.serverUrl !== EXPECTED_SERVER_URL
  );
  
  if (needsUpdate.length === 0) {
    console.log('✅ All phone numbers are correctly configured!\n');
    return;
  }
  
  console.log(`\n⚠️  Found ${needsUpdate.length} phone number(s) that need updating:\n`);
  
  needsUpdate.forEach((phone, index) => {
    console.log(`${index + 1}. ${phone.number || phone.phoneNumber || 'N/A'} (ID: ${phone.id})`);
    console.log(`   Current: ${phone.serverUrl || 'NOT SET'}`);
    console.log(`   Should be: ${EXPECTED_SERVER_URL}\n`);
  });
  
  // Ask if user wants to update (for now, just show instructions)
  console.log('📋 To update phone numbers:');
  console.log('   1. Go to VAPI Dashboard → Phone Numbers');
  console.log('   2. Select each phone number');
  console.log('   3. Set "Phone Number Server URL" to:');
  console.log(`      ${EXPECTED_SERVER_URL}`);
  console.log('   4. Save changes\n');
  
  // Optionally, we could auto-update here, but let's be safe and require manual confirmation
  console.log('💡 Tip: You can also update via API using the phone number ID(s) shown above.\n');
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

