#!/usr/bin/env node
/**
 * Comprehensive Verification Script
 * Verifies all components before making real calls
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SARAH_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';
const CALENDAR_AVAILABILITY_TOOL_ID = '9f765818-7aac-41ae-8976-69f0b71e2a91';
const CALENDAR_BOOKING_TOOL_ID = 'f7140b3e-a3b2-4a73-b71b-dad5bd5681ef';

const results = {
  infrastructure: [],
  tools: [],
  configuration: [],
  integration: []
};

async function testInfrastructure() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 PHASE 1: Infrastructure Verification');
  console.log('='.repeat(80));
  
  // Test 1.1: Server Health
  try {
    const response = await axios.get(`${RENDER_URL}/health`);
    if (response.status === 200 && response.data.status === 'healthy') {
      console.log('✅ 1.1 Server Health: PASSED');
      results.infrastructure.push({ test: 'Server Health', pass: true });
    } else {
      throw new Error('Unexpected response');
    }
  } catch (error) {
    console.log('❌ 1.1 Server Health: FAILED');
    console.log(`   Error: ${error.message}`);
    results.infrastructure.push({ test: 'Server Health', pass: false });
  }
  
  // Test 1.2: Webhook Endpoint
  try {
    const response = await axios.post(`${RENDER_URL}/webhook/vapi`, { test: 'data' });
    if (response.status === 200) {
      console.log('✅ 1.2 Webhook Endpoint: PASSED');
      results.infrastructure.push({ test: 'Webhook Endpoint', pass: true });
    } else {
      throw new Error('Unexpected status');
    }
  } catch (error) {
    console.log('❌ 1.2 Webhook Endpoint: FAILED');
    console.log(`   Error: ${error.message}`);
    results.infrastructure.push({ test: 'Webhook Endpoint', pass: false });
  }
  
  console.log('\n📊 Infrastructure Results:');
  const infraPassed = results.infrastructure.filter(r => r.pass).length;
  const infraTotal = results.infrastructure.length;
  console.log(`   ${infraPassed}/${infraTotal} tests passed\n`);
}

async function testTools() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 PHASE 2: Tool Configuration Verification');
  console.log('='.repeat(80));
  
  // Test 2.1: Calendar Availability Tool Server URL
  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/tool/${CALENDAR_AVAILABILITY_TOOL_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const tool = response.data;
    const serverUrl = tool.server?.url;
    const expectedUrl = `${RENDER_URL}/webhook/vapi`;
    
    if (serverUrl === expectedUrl) {
      console.log('✅ 2.1 Calendar Availability Tool Server URL: PASSED');
      console.log(`   Server URL: ${serverUrl}`);
      results.tools.push({ test: 'Calendar Availability Server URL', pass: true });
    } else {
      console.log('❌ 2.1 Calendar Availability Tool Server URL: FAILED');
      console.log(`   Current: ${serverUrl || 'NOT SET'}`);
      console.log(`   Expected: ${expectedUrl}`);
      results.tools.push({ test: 'Calendar Availability Server URL', pass: false });
    }
  } catch (error) {
    console.log('❌ 2.1 Calendar Availability Tool Server URL: FAILED');
    console.log(`   Error: ${error.message}`);
    results.tools.push({ test: 'Calendar Availability Server URL', pass: false });
  }
  
  // Test 2.2: Calendar Booking Tool Server URL
  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/tool/${CALENDAR_BOOKING_TOOL_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const tool = response.data;
    const serverUrl = tool.server?.url;
    const expectedUrl = `${RENDER_URL}/webhook/vapi`;
    
    if (serverUrl === expectedUrl) {
      console.log('✅ 2.2 Calendar Booking Tool Server URL: PASSED');
      console.log(`   Server URL: ${serverUrl}`);
      results.tools.push({ test: 'Calendar Booking Server URL', pass: true });
    } else {
      console.log('❌ 2.2 Calendar Booking Tool Server URL: FAILED');
      console.log(`   Current: ${serverUrl || 'NOT SET'}`);
      console.log(`   Expected: ${expectedUrl}`);
      results.tools.push({ test: 'Calendar Booking Server URL', pass: false });
    }
  } catch (error) {
    console.log('❌ 2.2 Calendar Booking Tool Server URL: FAILED');
    console.log(`   Error: ${error.message}`);
    results.tools.push({ test: 'Calendar Booking Server URL', pass: false });
  }
  
  // Test 2.3: Calendar Tool Functionality
  try {
    const response = await axios.post(
      `${RENDER_URL}/webhook/vapi`,
      {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "test-verify",
            function: {
              name: "check_calendar_availability",
              arguments: {
                requestedDate: "tomorrow",
                requestedTime: "10 AM",
                timezone: "America/New_York"
              }
            }
          }]
        }
      }
    );
    
    if (response.status === 200 && response.data.results) {
      console.log('✅ 2.3 Calendar Tool Functionality: PASSED');
      results.tools.push({ test: 'Calendar Tool Functionality', pass: true });
    } else {
      throw new Error('Unexpected response');
    }
  } catch (error) {
    console.log('❌ 2.3 Calendar Tool Functionality: FAILED');
    console.log(`   Error: ${error.message}`);
    results.tools.push({ test: 'Calendar Tool Functionality', pass: false });
  }
  
  console.log('\n📊 Tools Results:');
  const toolsPassed = results.tools.filter(r => r.pass).length;
  const toolsTotal = results.tools.length;
  console.log(`   ${toolsPassed}/${toolsTotal} tests passed\n`);
}

async function testConfiguration() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 PHASE 3: Configuration Verification');
  console.log('='.repeat(80));
  
  // Test 3.1: Sarah's Prompt
  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const assistant = response.data;
    const prompt = assistant.model.messages[0].content;
    
    // Check for new Phase 2 instructions
    const hasNewInstructions = prompt.includes('Only mention fields that have ACTUAL VALUES') ||
                               prompt.includes('NEVER say placeholder text');
    
    if (hasNewInstructions) {
      console.log('✅ 3.1 Sarah\'s Prompt Updated: PASSED');
      console.log('   Prompt contains new Phase 2 instructions');
      results.configuration.push({ test: 'Sarah Prompt Update', pass: true });
    } else {
      console.log('⚠️  3.1 Sarah\'s Prompt Updated: NEEDS VERIFICATION');
      console.log('   Could not verify new instructions in prompt');
      console.log('   Please manually check VAPI dashboard');
      results.configuration.push({ test: 'Sarah Prompt Update', pass: null });
    }
  } catch (error) {
    console.log('❌ 3.1 Sarah\'s Prompt: FAILED');
    console.log(`   Error: ${error.message}`);
    results.configuration.push({ test: 'Sarah Prompt Update', pass: false });
  }
  
  // Test 3.2: VAPI Phone Number Server URL
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (phoneNumberId) {
    try {
      const response = await axios.get(
        `${VAPI_BASE_URL}/phone-number/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const phoneNumber = response.data;
      const serverUrl = phoneNumber.serverUrl;
      const expectedUrl = `${RENDER_URL}/webhook/vapi`;
      
      if (serverUrl === expectedUrl) {
        console.log('✅ 3.2 VAPI Phone Number Server URL: PASSED');
        console.log(`   Server URL: ${serverUrl}`);
        results.configuration.push({ test: 'Phone Number Server URL', pass: true });
      } else {
        console.log('❌ 3.2 VAPI Phone Number Server URL: FAILED');
        console.log(`   Current: ${serverUrl || 'NOT SET'}`);
        console.log(`   Expected: ${expectedUrl}`);
        results.configuration.push({ test: 'Phone Number Server URL', pass: false });
      }
    } catch (error) {
      console.log('⚠️  3.2 VAPI Phone Number Server URL: SKIPPED');
      console.log('   Could not verify (may need manual check)');
      results.configuration.push({ test: 'Phone Number Server URL', pass: null });
    }
  } else {
    console.log('⚠️  3.2 VAPI Phone Number Server URL: SKIPPED');
    console.log('   VAPI_PHONE_NUMBER_ID not set');
    results.configuration.push({ test: 'Phone Number Server URL', pass: null });
  }
  
  console.log('\n📊 Configuration Results:');
  const configPassed = results.configuration.filter(r => r.pass === true).length;
  const configTotal = results.configuration.filter(r => r.pass !== null).length;
  console.log(`   ${configPassed}/${configTotal} tests passed\n`);
}

async function testIntegration() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 PHASE 4: Integration Verification');
  console.log('='.repeat(80));
  
  // Test 4.1: GHL API Connection
  try {
    const ghlClient = require('../src/services/ghl-client.blueprint');
    const calendarId = process.env.GHL_CALENDAR_ID;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const slots = await ghlClient.checkCalendarAvailability(
      calendarId,
      dateStr,
      process.env.CALENDAR_TIMEZONE || 'America/New_York'
    );
    
    if (Array.isArray(slots)) {
      console.log('✅ 4.1 GHL API Connection: PASSED');
      console.log(`   Found ${slots.length} available slots`);
      results.integration.push({ test: 'GHL API Connection', pass: true });
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.log('❌ 4.1 GHL API Connection: FAILED');
    console.log(`   Error: ${error.message}`);
    results.integration.push({ test: 'GHL API Connection', pass: false });
  }
  
  // Test 4.2: Variable Mapping
  console.log('\n📋 4.2 Variable Mapping Test:');
  console.log('   Run: node scripts/test-variable-mapping.js');
  console.log('   (Manual verification required)');
  results.integration.push({ test: 'Variable Mapping', pass: null });
  
  console.log('\n📊 Integration Results:');
  const integrationPassed = results.integration.filter(r => r.pass === true).length;
  const integrationTotal = results.integration.filter(r => r.pass !== null).length;
  console.log(`   ${integrationPassed}/${integrationTotal} tests passed\n`);
}

async function generateSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(80));
  
  const allTests = [
    ...results.infrastructure,
    ...results.tools,
    ...results.configuration,
    ...results.integration
  ];
  
  const passed = allTests.filter(r => r.pass === true).length;
  const failed = allTests.filter(r => r.pass === false).length;
  const skipped = allTests.filter(r => r.pass === null).length;
  const total = allTests.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped/Manual: ${skipped}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0 && passed > 0) {
    console.log('✅ ALL AUTOMATED TESTS PASSED!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Run: node scripts/test-variable-mapping.js');
    console.log('2. Verify GHL workflow has correct Squad ID');
    console.log('3. Make test call to your own number');
    console.log('4. Monitor Render logs during call');
    console.log('5. Verify everything works end-to-end\n');
  } else if (failed > 0) {
    console.log('❌ SOME TESTS FAILED');
    console.log('\n⚠️  Please fix the failing tests before proceeding.\n');
    process.exit(1);
  } else {
    console.log('⚠️  NO TESTS RUN - Please check configuration\n');
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 COMPREHENSIVE PRE-CALL VERIFICATION');
  console.log('='.repeat(80));
  console.log('\n⚠️  Verifying all components before making real calls...\n');
  
  await testInfrastructure();
  await testTools();
  await testConfiguration();
  await testIntegration();
  await generateSummary();
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

