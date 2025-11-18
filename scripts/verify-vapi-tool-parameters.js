#!/usr/bin/env node
/**
 * Verify VAPI Tool Parameter Names
 * Checks what parameter names the calendar tools actually use
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

const CALENDAR_AVAILABILITY_TOOL_ID = '9f765818-7aac-41ae-8976-69f0b71e2a91';
const CALENDAR_BOOKING_TOOL_ID = 'f7140b3e-a3b2-4a73-b71b-dad5bd5681ef';

async function verifyToolParameters() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Verifying VAPI Tool Parameter Names');
  console.log('='.repeat(80) + '\n');

  try {
    // Check Calendar Availability Tool
    console.log('📋 Checking check_calendar_availability tool...\n');
    const availabilityResponse = await axios.get(
      `${VAPI_BASE_URL}/tool/${CALENDAR_AVAILABILITY_TOOL_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const availabilityTool = availabilityResponse.data;
    console.log('Tool Name:', availabilityTool.function?.name || availabilityTool.name);
    console.log('Tool Type:', availabilityTool.type);
    
    if (availabilityTool.function?.parameters) {
      console.log('\n📝 Parameters Schema:');
      console.log(JSON.stringify(availabilityTool.function.parameters, null, 2));
      
      const props = availabilityTool.function.parameters.properties || {};
      console.log('\n✅ Parameter Names Found:');
      Object.keys(props).forEach(key => {
        console.log(`   - ${key}: ${props[key].description || 'No description'}`);
      });
      
      // Check for expected parameters
      const hasDate = props.date || props.requestedDate;
      const hasTime = props.time || props.requestedTime;
      const hasTimezone = props.timezone;
      
      console.log('\n🔍 Parameter Name Analysis:');
      console.log(`   date parameter: ${hasDate ? '✅ Found (' + Object.keys(props).find(k => k === 'date' || k === 'requestedDate') + ')' : '❌ NOT FOUND'}`);
      console.log(`   time parameter: ${hasTime ? '✅ Found (' + Object.keys(props).find(k => k === 'time' || k === 'requestedTime') + ')' : '❌ NOT FOUND'}`);
      console.log(`   timezone parameter: ${hasTimezone ? '✅ Found' : '❌ NOT FOUND'}`);
      
      if (!hasDate || !hasTime || !hasTimezone) {
        console.log('\n⚠️  WARNING: Missing expected parameters!');
        console.log('   Handler expects: date/time/timezone OR requestedDate/requestedTime/timezone');
        console.log('   Tool provides:', Object.keys(props).join(', '));
      }
    } else {
      console.log('⚠️  No parameters schema found');
    }

    // Check Calendar Booking Tool
    console.log('\n' + '='.repeat(80));
    console.log('📋 Checking book_calendar_appointment tool...\n');
    const bookingResponse = await axios.get(
      `${VAPI_BASE_URL}/tool/${CALENDAR_BOOKING_TOOL_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const bookingTool = bookingResponse.data;
    console.log('Tool Name:', bookingTool.function?.name || bookingTool.name);
    console.log('Tool Type:', bookingTool.type);
    
    if (bookingTool.function?.parameters) {
      console.log('\n📝 Parameters Schema:');
      console.log(JSON.stringify(bookingTool.function.parameters, null, 2));
      
      const props = bookingTool.function.parameters.properties || {};
      console.log('\n✅ Parameter Names Found:');
      Object.keys(props).forEach(key => {
        console.log(`   - ${key}: ${props[key].description || 'No description'}`);
      });
    } else {
      console.log('⚠️  No parameters schema found');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY\n');
    console.log('✅ Tool parameter verification complete');
    console.log('\n💡 If parameter names don\'t match handler expectations:');
    console.log('   1. Update handler to match tool definition, OR');
    console.log('   2. Update tool definition in VAPI to match handler\n');

  } catch (error) {
    console.error('\n❌ Error verifying tools:', error.response?.data || error.message);
    process.exit(1);
  }
}

verifyToolParameters();

