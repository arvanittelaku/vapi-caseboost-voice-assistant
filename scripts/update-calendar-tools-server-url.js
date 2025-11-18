#!/usr/bin/env node
/**
 * Update Calendar Tools Server URL
 * Sets the server URL for calendar tools to point to Render deployment
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const RENDER_SERVER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';

// Tool IDs from check-sarah-tools.js output
const CALENDAR_AVAILABILITY_TOOL_ID = '9f765818-7aac-41ae-8976-69f0b71e2a91';
const CALENDAR_BOOKING_TOOL_ID = 'f7140b3e-a3b2-4a73-b71b-dad5bd5681ef';

async function updateToolServerUrl(toolId, toolName) {
  try {
    console.log(`\n📋 Updating ${toolName}...`);
    
    // First, get the current tool configuration
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/tool/${toolId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const currentTool = getResponse.data;
    console.log(`   Current Server URL: ${currentTool.server?.url || 'NOT SET'}`);
    
    // Update the server URL (use server.url format, not serverUrl)
    const updatePayload = {
      server: {
        url: `${RENDER_SERVER_URL}/webhook/vapi`,
        timeoutSeconds: currentTool.server?.timeoutSeconds || 20,
        headers: currentTool.server?.headers || {}
      }
    };
    
    console.log(`   New Server URL: ${updatePayload.server.url}`);
    
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/tool/${toolId}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   ✅ ${toolName} updated successfully!`);
    console.log(`   Server URL: ${updateResponse.data.server?.url || 'N/A'}`);
    
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error updating ${toolName}:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🔧 Updating Calendar Tools Server URLs\n');
  console.log('='.repeat(60));
  console.log(`Render Server URL: ${RENDER_SERVER_URL}`);
  console.log(`Target Endpoint: ${RENDER_SERVER_URL}/webhook/vapi`);
  console.log('='.repeat(60));
  
  if (!VAPI_API_KEY) {
    console.error('\n❌ ERROR: VAPI_API_KEY not set in environment');
    process.exit(1);
  }
  
  const results = [];
  
  // Update calendar availability tool
  const result1 = await updateToolServerUrl(
    CALENDAR_AVAILABILITY_TOOL_ID,
    'check_calendar_availability'
  );
  results.push({ tool: 'check_calendar_availability', success: result1 });
  
  // Update calendar booking tool
  const result2 = await updateToolServerUrl(
    CALENDAR_BOOKING_TOOL_ID,
    'book_calendar_appointment'
  );
  results.push({ tool: 'book_calendar_appointment', success: result2 });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPDATE SUMMARY\n');
  
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.tool}: ${r.success ? 'Updated' : 'Failed'}`);
  });
  
  const allSuccess = results.every(r => r.success);
  
  if (allSuccess) {
    console.log('\n✅ All calendar tools updated successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Test the calendar tools again in a call');
    console.log('2. Check Render logs for webhook requests');
    console.log('3. Verify appointments are created in GHL');
  } else {
    console.log('\n❌ Some tools failed to update. Please check the errors above.');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });

