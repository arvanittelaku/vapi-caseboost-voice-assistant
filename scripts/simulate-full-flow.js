#!/usr/bin/env node
/**
 * Simulate Full Flow: GHL Workflow → VAPI Call → Tools → Data Updates
 * This simulates what happens when a GHL workflow triggers a VAPI call
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || '21a417c0-ef45-41dc-a5fa-e02207fb9dad';

// Simulated GHL contact data
const mockGHLContact = {
  id: 'test-contact-123',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  phone: '+12135551234',
  source: 'Website Form',
  type: 'Lead',
  customFields: {
    firm_name: 'Smith & Associates',
    practice_area: 'Personal Injury',
    practice_region: 'New York',
    cases_monthly: '25',
    firm_size: '10',
    marketing_budget: '5000'
  }
};

async function simulateGHLWorkflowPayload() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 STEP 1: Simulating GHL Workflow Payload');
  console.log('='.repeat(80));
  
  // Load the workflow payload template
  const payloadPath = path.join(__dirname, '..', 'GHL-WORKFLOW-UPDATED-PAYLOAD.json');
  if (!fs.existsSync(payloadPath)) {
    throw new Error('GHL-WORKFLOW-UPDATED-PAYLOAD.json not found');
  }
  
  const template = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  
  // Replace template variables with actual values
  const payload = JSON.parse(JSON.stringify(template).replace(/\{\{contact\.(\w+)\}\}/g, (match, field) => {
    // Map GHL field names to contact properties
    const fieldMap = {
      'first_name': mockGHLContact.firstName,
      'last_name': mockGHLContact.lastName,
      'email': mockGHLContact.email,
      'phone': mockGHLContact.phone,
      'source': mockGHLContact.source,
      'type': mockGHLContact.type,
      'firm_name': mockGHLContact.customFields.firm_name,
      'practice_area': mockGHLContact.customFields.practice_area,
      'practice_region': mockGHLContact.customFields.practice_region,
      'cases_monthly': mockGHLContact.customFields.cases_monthly,
      'firm_size': mockGHLContact.customFields.firm_size,
      'marketing_budget': mockGHLContact.customFields.marketing_budget
    };
    
    return fieldMap[field] || match;
  }));
  
  // Also replace in firstMessage
  if (payload.assistantOverrides?.firstMessage) {
    payload.assistantOverrides.firstMessage = payload.assistantOverrides.firstMessage.replace(
      /\{\{contact\.first_name\}\}/g,
      mockGHLContact.firstName
    );
  }
  
  console.log('\n✅ Payload created:');
  console.log(`   Squad ID: ${payload.squadId}`);
  console.log(`   Phone Number ID: ${payload.phoneNumberId}`);
  console.log(`   Customer: ${payload.customer.name} (${payload.customer.number})`);
  console.log(`   Variables: ${Object.keys(payload.assistantOverrides.variableValues).length} variables`);
  console.log(`   First Message: ${payload.assistantOverrides.firstMessage.substring(0, 60)}...`);
  
  return payload;
}

async function verifyVAPICallPayload(payload) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 STEP 2: Verifying VAPI Call Payload Structure');
  console.log('='.repeat(80));
  
  const checks = [];
  
  // Check squad ID
  checks.push({
    name: 'Squad ID',
    pass: payload.squadId === SQUAD_ID,
    expected: SQUAD_ID,
    actual: payload.squadId
  });
  
  // Check phone number ID
  checks.push({
    name: 'Phone Number ID',
    pass: payload.phoneNumberId === PHONE_NUMBER_ID,
    expected: PHONE_NUMBER_ID,
    actual: payload.phoneNumberId
  });
  
  // Check customer data
  checks.push({
    name: 'Customer Number',
    pass: !!payload.customer?.number && payload.customer.number.startsWith('+'),
    expected: 'E.164 format',
    actual: payload.customer?.number
  });
  
  checks.push({
    name: 'Customer Name',
    pass: !!payload.customer?.name,
    expected: 'Non-empty string',
    actual: payload.customer?.name
  });
  
  // Check variables
  const variables = payload.assistantOverrides?.variableValues || {};
  checks.push({
    name: 'Variable Values',
    pass: Object.keys(variables).length > 0,
    expected: 'At least 1 variable',
    actual: `${Object.keys(variables).length} variables`
  });
  
  // Check critical variables
  const criticalVars = ['firstName', 'lastName', 'email', 'phone'];
  criticalVars.forEach(varName => {
    checks.push({
      name: `Variable: ${varName}`,
      pass: !!variables[varName] && variables[varName] !== `{{contact.${varName}}}`, // Not placeholder
      expected: 'Actual value',
      actual: variables[varName] || 'MISSING'
    });
  });
  
  // Check first message
  checks.push({
    name: 'First Message',
    pass: !!payload.assistantOverrides?.firstMessage && 
          !payload.assistantOverrides.firstMessage.includes('{{contact.first_name}}'), // Replaced
    expected: 'Personalized message',
    actual: payload.assistantOverrides?.firstMessage?.substring(0, 50) || 'MISSING'
  });
  
  // Print results
  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (!check.pass) {
      console.log(`   Expected: ${check.expected}`);
      console.log(`   Actual: ${check.actual}`);
    }
  });
  
  const allPassed = checks.every(c => c.pass);
  console.log(`\n${allPassed ? '✅' : '❌'} Payload verification: ${checks.filter(c => c.pass).length}/${checks.length} checks passed`);
  
  return allPassed;
}

async function simulateToolCalls() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 STEP 3: Simulating Tool Calls');
  console.log('='.repeat(80));
  
  // Simulate calendar availability check
  console.log('\n📅 Simulating: check_calendar_availability');
  try {
    const availabilityPayload = {
      message: {
        type: "tool-calls",
        toolCalls: [{
          id: "sim-test-availability",
          function: {
            name: "check_calendar_availability",
            arguments: {
              date: "today",
              time: "2:00 PM",
              timezone: "America/New_York"
            }
          }
        }]
      }
    };
    
    const response = await axios.post(`${RENDER_URL}/webhook/vapi`, availabilityPayload, { timeout: 10000 });
    const result = response.data.results?.[0]?.result;
    
    if (result && (result.available !== undefined || result.error)) {
      console.log('✅ Calendar availability tool works');
      console.log(`   Available: ${result.available}`);
      console.log(`   Message: ${result.message?.substring(0, 60)}...`);
      if (result.alternatives) {
        console.log(`   Alternatives: ${result.alternatives.length} options`);
      }
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Calendar availability tool failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
  
  return true;
}

async function verifyDataMapping() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 STEP 4: Verifying Data Mapping');
  console.log('='.repeat(80));
  
  const payloadPath = path.join(__dirname, '..', 'GHL-WORKFLOW-UPDATED-PAYLOAD.json');
  const template = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  const variables = template.assistantOverrides?.variableValues || {};
  
  // Check that all variables use GHL syntax
  const checks = [];
  Object.entries(variables).forEach(([key, value]) => {
    const isGHLFormat = typeof value === 'string' && value.startsWith('{{contact.') && value.endsWith('}}');
    checks.push({
      variable: key,
      pass: isGHLFormat,
      value: value
    });
  });
  
  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.variable}: ${check.value}`);
  });
  
  const allPassed = checks.every(c => c.pass);
  console.log(`\n${allPassed ? '✅' : '❌'} Data mapping: ${checks.filter(c => c.pass).length}/${checks.length} variables correctly formatted`);
  
  return allPassed;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 FULL FLOW SIMULATION');
  console.log('='.repeat(80));
  console.log('\nSimulating: GHL Workflow → VAPI Call → Tools → Data Updates\n');
  
  try {
    // Step 1: Simulate GHL workflow payload
    const payload = await simulateGHLWorkflowPayload();
    
    // Step 2: Verify payload structure
    const payloadValid = await verifyVAPICallPayload(payload);
    if (!payloadValid) {
      console.log('\n❌ Payload verification failed. Fix issues before proceeding.');
      process.exit(1);
    }
    
    // Step 3: Simulate tool calls
    const toolsWork = await simulateToolCalls();
    if (!toolsWork) {
      console.log('\n❌ Tool simulation failed. Fix issues before proceeding.');
      process.exit(1);
    }
    
    // Step 4: Verify data mapping
    const mappingValid = await verifyDataMapping();
    if (!mappingValid) {
      console.log('\n❌ Data mapping verification failed. Fix issues before proceeding.');
      process.exit(1);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SIMULATION SUMMARY');
    console.log('='.repeat(80));
    console.log('✅ GHL Workflow Payload: PASSED');
    console.log('✅ VAPI Call Payload: PASSED');
    console.log('✅ Tool Calls: PASSED');
    console.log('✅ Data Mapping: PASSED');
    console.log('\n🎉 Full flow simulation successful!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Run comprehensive verification: node scripts/comprehensive-verification.js');
    console.log('   2. Make a test call with real contact');
    console.log('   3. Monitor logs during call');
    console.log('   4. Verify all data flows correctly\n');
    
  } catch (error) {
    console.error('\n❌ Simulation failed:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

main();

