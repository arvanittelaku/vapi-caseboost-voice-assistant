#!/usr/bin/env node

/**
 * Script to assign phone numbers to correct assistants/squads
 * Run: node scripts/assign-phone-numbers.js
 * 
 * This fixes the VAPI UI bug where assignments get lost on refresh
 */

require('dotenv').config();
const axios = require('axios');

// VAPI Configuration
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Phone Numbers
const PHONE_1_ID = 'a6818a6f-32af-4d4a-9814-1d388d366b01'; // +12134938627 - Case Boost Confirmation
const PHONE_2_ID = 'bd9e0ff5-c3af-4b39-a2f3-21b7debcb434'; // +12136721526 - CaseBoost Phone number

// Assistants & Squads
const CONFIRMATION_ASSISTANT_ID = 'b6bcfa8e-d02b-4bc1-b6d3-2f284a8f7d1a';
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16';

if (!VAPI_API_KEY) {
  console.error('❌ VAPI_API_KEY not found in environment variables');
  process.exit(1);
}

const vapiClient = axios.create({
  baseURL: 'https://api.vapi.ai',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function assignPhoneNumbers() {
  console.log('🔧 Assigning phone numbers to assistants/squads...\n');

  try {
    // ==========================================
    // Phone #1: Confirmation Assistant (Outbound)
    // ==========================================
    console.log('📞 Phone #1: +12134938627 (Case Boost Confirmation)');
    console.log('   Assigning to: CaseBoost Appointment Confirmation');
    
    const phone1Payload = {
      assistantId: CONFIRMATION_ASSISTANT_ID
    };
    
    try {
      const phone1Response = await vapiClient.patch(
        `/phone-number/${PHONE_1_ID}`,
        phone1Payload
      );
      console.log('   ✅ Successfully assigned Confirmation Assistant');
      console.log(`   Assistant ID: ${phone1Response.data.assistantId || 'N/A'}`);
    } catch (error) {
      console.error('   ❌ Failed to assign Phone #1:', error.response?.data?.message || error.message);
    }

    console.log('');

    // ==========================================
    // Phone #2: Squad (Outbound)
    // ==========================================
    console.log('📞 Phone #2: +12136721526 (CaseBoost Phone number)');
    console.log('   Assigning to: Lead Follow-up Squad');
    
    const phone2Payload = {
      squadId: SQUAD_ID
    };
    
    try {
      const phone2Response = await vapiClient.patch(
        `/phone-number/${PHONE_2_ID}`,
        phone2Payload
      );
      console.log('   ✅ Successfully assigned Squad');
      console.log(`   Squad ID: ${phone2Response.data.squadId || 'N/A'}`);
    } catch (error) {
      console.error('   ❌ Failed to assign Phone #2:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ Phone number assignment complete!');
    console.log('\n📋 Summary:');
    console.log('   Phone #1 (+12134938627) → Confirmation Assistant');
    console.log('   Phone #2 (+12136721526) → Lead Follow-up Squad');
    console.log('\n💡 Tip: Run this script anytime the UI loses the assignments');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Verify phone number IDs function
async function verifyPhoneNumbers() {
  console.log('\n🔍 Verifying phone number IDs...\n');
  
  try {
    const response = await vapiClient.get('/phone-number');
    const phoneNumbers = response.data;
    
    console.log('📱 Your phone numbers:');
    phoneNumbers.forEach(phone => {
      console.log(`\n   Number: ${phone.number || 'N/A'}`);
      console.log(`   ID: ${phone.id}`);
      console.log(`   Label: ${phone.name || 'No label'}`);
      console.log(`   Assistant: ${phone.assistantId || 'None'}`);
      console.log(`   Squad: ${phone.squadId || 'None'}`);
    });
    
    console.log('\n💡 If the IDs above don\'t match the script, update them in the script!');
    
  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error.response?.data?.message || error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify') || args.includes('-v')) {
    await verifyPhoneNumbers();
  } else {
    await assignPhoneNumbers();
  }
}

main();

