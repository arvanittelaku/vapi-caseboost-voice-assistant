#!/usr/bin/env node
/**
 * Fix VAPI Configuration Automatically
 * Attaches tools, sets default assistant, assigns phone to squad
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16';
const SARAH_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || '87bbafd3-e24d-4de6-ac76-9ec93d180571';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'bd9e0ff5-c3af-4b39-a2f3-21b7debcb434';
const CALENDAR_AVAILABILITY_TOOL_ID = '9f765818-7aac-41ae-8976-69f0b71e2a91';
const CALENDAR_BOOKING_TOOL_ID = 'f7140b3e-a3b2-4a73-b71b-dad5bd5681ef';

const headers = {
  'Authorization': `Bearer ${VAPI_API_KEY}`,
  'Content-Type': 'application/json'
};

async function fixAssistantTools() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIX 1: Attaching Calendar Tools to Sarah Assistant');
  console.log('='.repeat(80));
  
  try {
    // Get current assistant
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ASSISTANT_ID}`,
      { headers }
    );
    
    const assistant = getResponse.data;
    const currentToolIds = assistant.toolIds || [];
    
    console.log(`\nCurrent tools: ${currentToolIds.length}`);
    console.log(`Has availability tool: ${currentToolIds.includes(CALENDAR_AVAILABILITY_TOOL_ID)}`);
    console.log(`Has booking tool: ${currentToolIds.includes(CALENDAR_BOOKING_TOOL_ID)}`);
    
    // Add tools if not present
    const newToolIds = [...new Set([...currentToolIds, CALENDAR_AVAILABILITY_TOOL_ID, CALENDAR_BOOKING_TOOL_ID])];
    
    if (newToolIds.length === currentToolIds.length) {
      console.log('\n✅ Tools already attached!');
      return true;
    }
    
    // Update assistant
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${SARAH_ASSISTANT_ID}`,
      { toolIds: newToolIds },
      { headers }
    );
    
    console.log('\n✅ Tools attached successfully!');
    console.log(`   Total tools: ${newToolIds.length}`);
    return true;
    
  } catch (error) {
    console.error('\n❌ Error attaching tools:', error.response?.data || error.message);
    return false;
  }
}

async function fixSquadDefaultAssistant() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIX 2: Setting Squad Default Assistant');
  console.log('='.repeat(80));
  
  try {
    // Get current squad
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/squad/${SQUAD_ID}`,
      { headers }
    );
    
    const squad = getResponse.data;
    const currentAssistantId = squad.defaultAssistantId;
    
    console.log(`\nCurrent default assistant: ${currentAssistantId || 'NONE'}`);
    console.log(`Expected: ${SARAH_ASSISTANT_ID}`);
    
    if (currentAssistantId === SARAH_ASSISTANT_ID) {
      console.log('\n✅ Default assistant already set!');
      return true;
    }
    
    // Update squad
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/squad/${SQUAD_ID}`,
      { defaultAssistantId: SARAH_ASSISTANT_ID },
      { headers }
    );
    
    console.log('\n✅ Default assistant set successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Error setting default assistant:', error.response?.data || error.message);
    return false;
  }
}

async function fixPhoneSquadAssignment() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIX 3: Assigning Phone Number to Squad');
  console.log('='.repeat(80));
  
  try {
    // Get current phone number
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/phone-number/${PHONE_NUMBER_ID}`,
      { headers }
    );
    
    const phone = getResponse.data;
    const currentSquadId = phone.squadId;
    
    console.log(`\nCurrent squad assignment: ${currentSquadId || 'NONE'}`);
    console.log(`Expected: ${SQUAD_ID}`);
    
    if (currentSquadId === SQUAD_ID) {
      console.log('\n✅ Phone already assigned to squad!');
      return true;
    }
    
    // Update phone number
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/phone-number/${PHONE_NUMBER_ID}`,
      { squadId: SQUAD_ID },
      { headers }
    );
    
    console.log('\n✅ Phone assigned to squad successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Error assigning phone to squad:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 AUTOMATIC VAPI CONFIGURATION FIXER');
  console.log('='.repeat(80));
  console.log('\nThis will fix the 3 critical VAPI configuration issues:\n');
  console.log('1. Attach calendar tools to Sarah assistant');
  console.log('2. Set squad default assistant to Sarah');
  console.log('3. Assign phone number to squad\n');
  
  const results = {
    tools: await fixAssistantTools(),
    defaultAssistant: await fixSquadDefaultAssistant(),
    phoneAssignment: await fixPhoneSquadAssignment()
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n${results.tools ? '✅' : '❌'} Tools attached: ${results.tools ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${results.defaultAssistant ? '✅' : '❌'} Default assistant: ${results.defaultAssistant ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${results.phoneAssignment ? '✅' : '❌'} Phone assignment: ${results.phoneAssignment ? 'SUCCESS' : 'FAILED'}`);
  
  const allFixed = Object.values(results).every(Boolean);
  
  if (allFixed) {
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run verification: node scripts/comprehensive-verification.js');
    console.log('   2. Update GHL workflow with corrected payload');
    console.log('   3. Make a test call\n');
  } else {
    console.log('\n⚠️  Some fixes failed. Check errors above.');
    console.log('   You may need to fix these manually in VAPI dashboard.\n');
  }
  
  console.log('='.repeat(80) + '\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

