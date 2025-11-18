#!/usr/bin/env node
/**
 * Get full tool details to see structure
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

const CALENDAR_AVAILABILITY_TOOL_ID = '9f765818-7aac-41ae-8976-69f0b71e2a91';
const CALENDAR_BOOKING_TOOL_ID = 'f7140b3e-a3b2-4a73-b71b-dad5bd5681ef';

async function getToolDetails(toolId, toolName) {
  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/tool/${toolId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`\n📋 ${toolName} Full Structure:`);
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error(`❌ Error fetching ${toolName}:`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

async function main() {
  await getToolDetails(CALENDAR_AVAILABILITY_TOOL_ID, 'check_calendar_availability');
  await getToolDetails(CALENDAR_BOOKING_TOOL_ID, 'book_calendar_appointment');
}

main();

