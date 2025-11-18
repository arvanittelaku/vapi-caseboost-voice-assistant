#!/usr/bin/env node
/**
 * VERIFY ALL CONFIGURATIONS
 * 
 * Checks all platform configurations programmatically
 * Run this before going live
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_CALENDAR_ID = process.env.GHL_CALENDAR_ID;
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16';
const PHONE_NUMBER_ID = 'bd9e0ff5-c3af-4b39-a2f3-21b7debcb434';
const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const SARAH_ASSISTANT_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

const results = {
  vapi: {},
  ghl: {},
  server: {},
  workflow: {},
  issues: [],
  warnings: []
};

async function verifyVAPIConfiguration() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING VAPI CONFIGURATION');
  console.log('='.repeat(80));
  
  try {
    // 1. Verify Squad
    const squadResponse = await axios.get(`https://api.vapi.ai/squad/${SQUAD_ID}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });
    
    const squad = squadResponse.data;
    results.vapi.squad = {
      exists: true,
      name: squad.name,
      members: squad.members?.length || 0,
      sarahIsFirst: squad.members?.[0]?.name?.toLowerCase().includes('sarah')
    };
    
    console.log(`✅ Squad exists: ${squad.name}`);
    console.log(`   Members: ${squad.members?.length || 0}`);
    console.log(`   Sarah is first: ${results.vapi.squad.sarahIsFirst ? '✅' : '❌'}`);
    
    if (!results.vapi.squad.sarahIsFirst) {
      results.warnings.push('Sarah is not the first member (start node) in squad');
    }
    
    // 2. Verify Phone Number
    const phoneResponse = await axios.get(`https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });
    
    const phone = phoneResponse.data;
    results.vapi.phone = {
      exists: true,
      number: phone.number,
      serverUrl: phone.serverUrl,
      squadId: phone.squadId,
      serverUrlCorrect: phone.serverUrl?.includes(RENDER_URL),
      assignedToSquad: phone.squadId === SQUAD_ID
    };
    
    console.log(`✅ Phone exists: ${phone.number}`);
    console.log(`   Server URL: ${phone.serverUrl || 'NOT SET'}`);
    console.log(`   Assigned to Squad: ${phone.squadId === SQUAD_ID ? '✅' : '❌'}`);
    
    if (!results.vapi.phone.serverUrlCorrect) {
      results.issues.push(`Phone server URL incorrect: ${phone.serverUrl || 'NOT SET'}`);
    }
    
    if (!results.vapi.phone.assignedToSquad) {
      results.issues.push(`Phone not assigned to squad. Current: ${phone.squadId || 'NONE'}`);
    }
    
    // 3. Verify Sarah Assistant
    const sarahResponse = await axios.get(`https://api.vapi.ai/assistant/${SARAH_ASSISTANT_ID}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });
    
    const sarah = sarahResponse.data;
    results.vapi.sarah = {
      exists: true,
      name: sarah.name,
      model: sarah.model?.provider && sarah.model?.name ? `${sarah.model.provider}/${sarah.model.name}` : 'N/A',
      voice: sarah.voice?.provider && sarah.voice?.voiceId ? `${sarah.voice.provider}/${sarah.voice.voiceId}` : 'N/A',
      toolsCount: sarah.tools?.length || 0
    };
    
    console.log(`✅ Sarah exists: ${sarah.name}`);
    console.log(`   Model: ${results.vapi.sarah.model}`);
    console.log(`   Voice: ${results.vapi.sarah.voice}`);
    console.log(`   Tools: ${results.vapi.sarah.toolsCount}`);
    
    // Check tool server URLs (if tools exist)
    if (sarah.tools && sarah.tools.length > 0) {
      const toolsWithServerUrl = sarah.tools.filter(t => 
        t.server?.url && t.server.url.includes(RENDER_URL)
      );
      
      console.log(`   Tools with correct server URL: ${toolsWithServerUrl.length}/${sarah.tools.length}`);
      
      if (toolsWithServerUrl.length < sarah.tools.length) {
        results.warnings.push(`Some tools don't have correct server URL`);
      }
    }
    
  } catch (error) {
    console.error(`❌ VAPI verification failed:`, error.response?.status || error.message);
    results.issues.push(`VAPI API error: ${error.response?.status || error.message}`);
  }
}

async function verifyGHLConfiguration() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING GHL CONFIGURATION');
  console.log('='.repeat(80));
  
  try {
    // 1. Verify Calendar API Access
    const testDate = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(testDate).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;
    
    const calendarResponse = await axios.get(
      `https://services.leadconnectorhq.com/calendars/${GHL_CALENDAR_ID}/free-slots`,
      {
        params: {
          startDate: startOfDay,
          endDate: endOfDay,
          timezone: 'America/New_York'
        },
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        },
        timeout: 15000
      }
    );
    
    results.ghl.calendar = {
      accessible: true,
      freeSlots: calendarResponse.data ? Object.keys(calendarResponse.data).length : 0
    };
    
    console.log(`✅ Calendar API accessible`);
    console.log(`   Calendar ID: ${GHL_CALENDAR_ID}`);
    
  } catch (error) {
    console.error(`❌ GHL Calendar API error:`, error.response?.status || error.message);
    results.warnings.push(`GHL Calendar API: ${error.response?.status || error.message}`);
  }
  
  // 2. Verify Workflow Payload
  const payloadPath = path.join(__dirname, '..', 'GHL-WORKFLOW-UPDATED-PAYLOAD.json');
  if (fs.existsSync(payloadPath)) {
    try {
      const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
      
      results.workflow.payload = {
        exists: true,
        squadIdCorrect: payload.squadId === SQUAD_ID,
        phoneIdCorrect: payload.phoneNumberId === PHONE_NUMBER_ID,
        hasVariables: !!payload.assistantOverrides?.variableValues,
        variableCount: payload.assistantOverrides?.variableValues ? Object.keys(payload.assistantOverrides.variableValues).length : 0,
        hasFirstMessage: !!payload.assistantOverrides?.firstMessage
      };
      
      console.log(`✅ Workflow payload file exists`);
      console.log(`   Squad ID correct: ${results.workflow.payload.squadIdCorrect ? '✅' : '❌'}`);
      console.log(`   Phone ID correct: ${results.workflow.payload.phoneIdCorrect ? '✅' : '❌'}`);
      console.log(`   Variables: ${results.workflow.payload.variableCount}`);
      
      if (!results.workflow.payload.squadIdCorrect) {
        results.issues.push(`Workflow payload has wrong squadId: ${payload.squadId}`);
      }
      
      if (!results.workflow.payload.phoneIdCorrect) {
        results.issues.push(`Workflow payload has wrong phoneNumberId: ${payload.phoneNumberId}`);
      }
      
    } catch (error) {
      results.issues.push(`Workflow payload JSON parse error: ${error.message}`);
    }
  } else {
    results.issues.push('Workflow payload file not found');
  }
}

async function verifyServerConfiguration() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING SERVER CONFIGURATION');
  console.log('='.repeat(80));
  
  try {
    const healthResponse = await axios.get(`${RENDER_URL}/health`, { timeout: 10000 });
    
    results.server.health = {
      online: healthResponse.data?.status === 'healthy',
      responseTime: healthResponse.headers['x-response-time'] || 'N/A',
      timestamp: healthResponse.data?.timestamp
    };
    
    console.log(`✅ Server is online`);
    console.log(`   Status: ${healthResponse.data?.status}`);
    
  } catch (error) {
    console.error(`❌ Server health check failed:`, error.message);
    results.issues.push(`Server not responding: ${error.message}`);
  }
  
  // Check environment variables
  const requiredEnvVars = {
    'VAPI_API_KEY': VAPI_API_KEY,
    'GHL_API_KEY': GHL_API_KEY,
    'GHL_LOCATION_ID': GHL_LOCATION_ID,
    'GHL_CALENDAR_ID': GHL_CALENDAR_ID
  };
  
  results.server.envVars = {};
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    const isSet = value && value.length > 0 && !value.includes('your_') && !value.includes('placeholder');
    results.server.envVars[key] = isSet;
    
    if (!isSet) {
      results.issues.push(`Environment variable ${key} not set or is placeholder`);
    }
  }
  
  console.log(`✅ Environment variables checked`);
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  const totalIssues = results.issues.length;
  const totalWarnings = results.warnings.length;
  
  console.log(`\n🔴 Critical Issues: ${totalIssues}`);
  if (totalIssues > 0) {
    results.issues.forEach((issue, i) => {
      console.log(`   ${i+1}. ${issue}`);
    });
  }
  
  console.log(`\n⚠️  Warnings: ${totalWarnings}`);
  if (totalWarnings > 0) {
    results.warnings.forEach((warning, i) => {
      console.log(`   ${i+1}. ${warning}`);
    });
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'VERIFICATION-REPORT-' + new Date().toISOString().split('T')[0] + '.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Final verdict
  console.log('\n' + '='.repeat(80));
  if (totalIssues === 0) {
    console.log('✅ ALL CRITICAL CONFIGURATIONS VERIFIED!');
    console.log('\nNext Steps:');
    console.log('1. Complete manual verification checklist');
    console.log('2. Run Postman tests');
    console.log('3. Make one test call');
    console.log('4. If all pass, go live!');
  } else {
    console.log('❌ CRITICAL ISSUES FOUND - FIX BEFORE GOING LIVE!');
    console.log('\nAction Required:');
    console.log('1. Fix all critical issues listed above');
    console.log('2. Re-run verification');
    console.log('3. Complete manual checklist');
    console.log('4. Then proceed with testing');
  }
  console.log('='.repeat(80) + '\n');
}

// Run all verifications
async function runVerification() {
  console.log('\n🚀 STARTING COMPREHENSIVE CONFIGURATION VERIFICATION...\n');
  
  await verifyVAPIConfiguration();
  await verifyGHLConfiguration();
  await verifyServerConfiguration();
  await generateReport();
}

runVerification().catch(console.error);

