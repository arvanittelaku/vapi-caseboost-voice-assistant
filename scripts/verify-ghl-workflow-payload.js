#!/usr/bin/env node
/**
 * Verify GHL Workflow Payload
 * Checks that the payload structure matches VAPI requirements
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || '21a417c0-ef45-41dc-a5fa-e02207fb9dad';

function verifyPayload() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Verifying GHL Workflow Payload');
  console.log('='.repeat(80));
  
  const payloadPath = path.join(__dirname, '..', 'GHL-WORKFLOW-UPDATED-PAYLOAD.json');
  
  if (!fs.existsSync(payloadPath)) {
    console.log('❌ Payload file not found:', payloadPath);
    return false;
  }
  
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  } catch (error) {
    console.log('❌ Invalid JSON:', error.message);
    return false;
  }
  
  const checks = [];
  
  // Check structure
  checks.push({
    name: 'Has squadId',
    pass: !!payload.squadId,
    value: payload.squadId
  });
  
  checks.push({
    name: 'Has phoneNumberId',
    pass: !!payload.phoneNumberId,
    value: payload.phoneNumberId
  });
  
  checks.push({
    name: 'Has customer object',
    pass: !!payload.customer && typeof payload.customer === 'object',
    value: payload.customer ? 'Present' : 'Missing'
  });
  
  checks.push({
    name: 'Has assistantOverrides',
    pass: !!payload.assistantOverrides && typeof payload.assistantOverrides === 'object',
    value: payload.assistantOverrides ? 'Present' : 'Missing'
  });
  
  // Check IDs match
  checks.push({
    name: 'Squad ID matches',
    pass: payload.squadId === SQUAD_ID,
    value: `${payload.squadId} === ${SQUAD_ID}`
  });
  
  checks.push({
    name: 'Phone Number ID matches',
    pass: payload.phoneNumberId === PHONE_NUMBER_ID,
    value: `${payload.phoneNumberId} === ${PHONE_NUMBER_ID}`
  });
  
  // Check customer fields
  if (payload.customer) {
    checks.push({
      name: 'Customer number uses GHL variable',
      pass: payload.customer.number === '{{contact.phone}}',
      value: payload.customer.number
    });
    
    checks.push({
      name: 'Customer name uses GHL variables',
      pass: payload.customer.name === '{{contact.first_name}} {{contact.last_name}}',
      value: payload.customer.name
    });
    
    checks.push({
      name: 'Customer email uses GHL variable',
      pass: payload.customer.email === '{{contact.email}}',
      value: payload.customer.email
    });
  }
  
  // Check variable values
  const variables = payload.assistantOverrides?.variableValues || {};
  const variableCount = Object.keys(variables).length;
  
  checks.push({
    name: 'Has variable values',
    pass: variableCount > 0,
    value: `${variableCount} variables`
  });
  
  // Check critical variables
  const criticalVars = ['firstName', 'lastName', 'email', 'phone'];
  criticalVars.forEach(varName => {
    checks.push({
      name: `Variable: ${varName}`,
      pass: !!variables[varName],
      value: variables[varName] || 'MISSING'
    });
  });
  
  // Check all variables use GHL syntax
  let allUseGHLSyntax = true;
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value !== 'string' || !value.startsWith('{{contact.') || !value.endsWith('}}')) {
      allUseGHLSyntax = false;
    }
  });
  
  checks.push({
    name: 'All variables use GHL syntax',
    pass: allUseGHLSyntax,
    value: allUseGHLSyntax ? 'Yes' : 'No'
  });
  
  // Check first message
  const firstMessage = payload.assistantOverrides?.firstMessage;
  checks.push({
    name: 'Has first message',
    pass: !!firstMessage && typeof firstMessage === 'string',
    value: firstMessage ? `${firstMessage.substring(0, 50)}...` : 'MISSING'
  });
  
  if (firstMessage) {
    checks.push({
      name: 'First message uses variable',
      pass: firstMessage.includes('{{contact.first_name}}'),
      value: firstMessage.includes('{{contact.first_name}}') ? 'Yes' : 'No'
    });
  }
  
  // Print results
  console.log('\n');
  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (!check.pass || check.value) {
      console.log(`   ${check.value}`);
    }
  });
  
  const allPassed = checks.every(c => c.pass);
  const passedCount = checks.filter(c => c.pass).length;
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 Results: ${passedCount}/${checks.length} checks passed`);
  
  if (allPassed) {
    console.log('✅ Payload is valid and ready to use!');
  } else {
    console.log('❌ Payload has issues. Fix the failed checks above.');
  }
  
  console.log('='.repeat(80) + '\n');
  
  return allPassed;
}

verifyPayload();

