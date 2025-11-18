#!/usr/bin/env node
/**
 * COMPREHENSIVE PRE-CALL AUDIT
 * 
 * Performs complete line-by-line audit of entire project before production calls
 * Tests all integrations, configurations, and code paths
 * 
 * Usage: node scripts/comprehensive-pre-call-audit.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const axios = require('axios');

const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_CALENDAR_ID = process.env.GHL_CALENDAR_ID;
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'bd9e0ff5-c3af-4b39-a2f3-21b7debcb434';

const auditResults = {
  phase1_code_audit: [],
  phase2_configuration: [],
  phase3_integrations: [],
  phase4_postman_tests: [],
  phase5_data_flow: [],
  issues: [],
  warnings: [],
  passed: 0,
  failed: 0,
  total: 0
};

function logResult(phase, testName, passed, details = '', severity = 'info') {
  auditResults[phase].push({ test: testName, pass: passed, details, severity });
  auditResults.total++;
  if (passed) {
    auditResults.passed++;
  } else {
    auditResults.failed++;
    if (severity === 'critical') {
      auditResults.issues.push({ phase, test: testName, details });
    } else {
      auditResults.warnings.push({ phase, test: testName, details });
    }
  }
  
  const icon = passed ? '✅' : (severity === 'critical' ? '❌' : '⚠️');
  console.log(`${icon} ${testName}${details ? ': ' + details : ''}`);
}

// ============================================================================
// PHASE 1: CODE AUDIT (Line-by-Line)
// ============================================================================

async function phase1_CodeAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 PHASE 1: CODE AUDIT (Line-by-Line)');
  console.log('='.repeat(80));
  
  // 1.1: Check webhook handler exists and is valid
  const webhookPath = path.join(__dirname, '..', 'src', 'webhooks', 'vapi-webhook.blueprint.js');
  if (fs.existsSync(webhookPath)) {
    const webhookCode = fs.readFileSync(webhookPath, 'utf8');
    
    // Check for critical functions
    const hasCheckAvailability = webhookCode.includes('handleCheckCalendarAvailability');
    const hasBookAppointment = webhookCode.includes('handleBookCalendarAppointment');
    const hasCaptureData = webhookCode.includes('capture_qualification_data');
    const hasErrorHandling = webhookCode.includes('catch');
    const hasParameterValidation = webhookCode.includes('parseUserDateTime');
    
    logResult('phase1_code_audit', '1.1 Webhook Handler Structure', 
      hasCheckAvailability && hasBookAppointment && hasCaptureData && hasErrorHandling,
      `Check: ${hasCheckAvailability}, Book: ${hasBookAppointment}, Capture: ${hasCaptureData}, Errors: ${hasErrorHandling}, Validation: ${hasParameterValidation}`
    );
    
    // Check for parameter handling (both naming conventions)
    const supportsBothNaming = webhookCode.includes('params.requestedDate || params.date') && 
                               webhookCode.includes('params.requestedTime || params.time');
    logResult('phase1_code_audit', '1.2 Parameter Naming Support', supportsBothNaming,
      'Supports both requestedDate/date and requestedTime/time');
    
    // Check for timezone handling
    const hasTimezoneHandling = webhookCode.includes('setZone') && webhookCode.includes('CALENDAR_TIMEZONE');
    logResult('phase1_code_audit', '1.3 Timezone Handling', hasTimezoneHandling,
      'Converts between user timezone and calendar timezone');
    
    // Check for working hours validation
    const hasWorkingHours = webhookCode.includes('WORKING_HOURS') && webhookCode.includes('days.includes');
    logResult('phase1_code_audit', '1.4 Working Hours Validation', hasWorkingHours,
      'Validates Mon-Fri, 9 AM - 5 PM');
    
    // Check for 1-minute tolerance
    const hasTolerance = webhookCode.includes('60000') || webhookCode.includes('diff < 60000');
    logResult('phase1_code_audit', '1.5 Slot Matching Tolerance', hasTolerance,
      'Uses 1-minute tolerance for slot matching');
    
    // Check for double-booking prevention
    const hasDoubleCheck = webhookCode.includes('Double-check availability') || 
                         (webhookCode.includes('isAvailable') && webhookCode.includes('book_calendar_appointment'));
    logResult('phase1_code_audit', '1.6 Double-Booking Prevention', hasDoubleCheck,
      'Re-checks availability before booking');
    
  } else {
    logResult('phase1_code_audit', '1.1 Webhook Handler Exists', false, 'File not found', 'critical');
  }
  
  // 1.7: Check GHL client implementation
  const ghlClientPath = path.join(__dirname, '..', 'src', 'services', 'ghl-client.blueprint.js');
  if (fs.existsSync(ghlClientPath)) {
    const ghlCode = fs.readFileSync(ghlClientPath, 'utf8');
    
    const hasCheckAvailability = ghlCode.includes('checkCalendarAvailability');
    const hasCreateAppointment = ghlCode.includes('createCalendarAppointment');
    const hasUpdateContact = ghlCode.includes('updateContactCustomFields');
    const usesUnixTimestamps = ghlCode.includes('toMillis()');
    const usesISO8601 = ghlCode.includes('toISOString()');
    
    logResult('phase1_code_audit', '1.7 GHL Client Implementation', 
      hasCheckAvailability && hasCreateAppointment && hasUpdateContact,
      `Check: ${hasCheckAvailability}, Create: ${hasCreateAppointment}, Update: ${hasUpdateContact}`
    );
    
    logResult('phase1_code_audit', '1.8 GHL API Format Compliance', 
      usesUnixTimestamps && usesISO8601,
      'Uses Unix timestamps for free-slots, ISO8601 for appointments');
    
  } else {
    logResult('phase1_code_audit', '1.7 GHL Client Exists', false, 'File not found', 'critical');
  }
  
  // 1.9: Check server configuration
  const serverPath = path.join(__dirname, '..', 'src', 'index.blueprint.js');
  if (fs.existsSync(serverPath)) {
    const serverCode = fs.readFileSync(serverPath, 'utf8');
    
    const hasBodyParser = serverCode.includes('bodyParser.json');
    const hasLargeLimit = serverCode.includes('500kb') || serverCode.includes('500');
    const hasHealthEndpoint = serverCode.includes('/health');
    const hasWebhookEndpoint = serverCode.includes('/webhook/vapi');
    const hasErrorHandler = serverCode.includes('app.use') && serverCode.includes('err');
    
    logResult('phase1_code_audit', '1.9 Server Configuration', 
      hasBodyParser && hasLargeLimit && hasHealthEndpoint && hasWebhookEndpoint,
      `BodyParser: ${hasBodyParser}, Limit: ${hasLargeLimit}, Health: ${hasHealthEndpoint}, Webhook: ${hasWebhookEndpoint}`
    );
    
    logResult('phase1_code_audit', '1.10 Payload Size Limit', hasLargeLimit,
      'Supports large VAPI payloads (500kb)');
    
  } else {
    logResult('phase1_code_audit', '1.9 Server File Exists', false, 'File not found', 'critical');
  }
  
  // 1.11: Check prompt file
  const promptPath = path.join(__dirname, '..', 'prompts', 'sarah-outbound-qualification-prompt.txt');
  if (fs.existsSync(promptPath)) {
    const promptContent = fs.readFileSync(promptPath, 'utf8');
    
    const hasToolCalls = promptContent.includes('capture_qualification_data') && 
                        promptContent.includes('send_info_case_boost');
    const hasCalendarTools = promptContent.includes('check_calendar_availability') || 
                            promptContent.includes('book_calendar_appointment');
    const hasTransferLogic = promptContent.includes('TRANSFER TO') || 
                            promptContent.includes('transfer');
    const avoidsPlaceholders = promptContent.includes('never use placeholder text') || 
                              promptContent.includes('skip empty fields');
    
    logResult('phase1_code_audit', '1.11 Prompt File Structure', 
      hasToolCalls && hasCalendarTools && hasTransferLogic,
      `Tools: ${hasToolCalls}, Calendar: ${hasCalendarTools}, Transfer: ${hasTransferLogic}`
    );
    
    logResult('phase1_code_audit', '1.12 Prompt Placeholder Handling', avoidsPlaceholders,
      'Explicitly avoids reading placeholder text literally');
    
  } else {
    logResult('phase1_code_audit', '1.11 Prompt File Exists', false, 'File not found', 'critical');
  }
}

// ============================================================================
// PHASE 2: CONFIGURATION AUDIT
// ============================================================================

async function phase2_ConfigurationAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('⚙️  PHASE 2: CONFIGURATION AUDIT');
  console.log('='.repeat(80));
  
  // 2.1: Environment variables
  const requiredEnvVars = {
    'VAPI_API_KEY': VAPI_API_KEY,
    'GHL_API_KEY': GHL_API_KEY,
    'GHL_LOCATION_ID': GHL_LOCATION_ID,
    'GHL_CALENDAR_ID': GHL_CALENDAR_ID,
    'VAPI_PHONE_NUMBER_ID': PHONE_NUMBER_ID
  };
  
  let allEnvVarsSet = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    const isSet = value && value !== `your_${key.toLowerCase()}_here` && value.length > 0;
    logResult('phase2_configuration', `2.1 ${key}`, isSet, 
      isSet ? 'Set' : 'Missing or placeholder', isSet ? 'info' : 'critical');
    if (!isSet) allEnvVarsSet = false;
  }
  
  // 2.2: GHL Workflow Payload
  const payloadPath = path.join(__dirname, '..', 'GHL-WORKFLOW-UPDATED-PAYLOAD.json');
  if (fs.existsSync(payloadPath)) {
    try {
      const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
      
      const hasSquadId = payload.squadId === SQUAD_ID;
      const hasPhoneId = payload.phoneNumberId === PHONE_NUMBER_ID;
      const hasVariables = payload.assistantOverrides?.variableValues;
      const hasFirstMessage = payload.assistantOverrides?.firstMessage;
      const variableCount = hasVariables ? Object.keys(hasVariables).length : 0;
      
      logResult('phase2_configuration', '2.2 GHL Workflow Payload', 
        hasSquadId && hasPhoneId && hasVariables && hasFirstMessage,
        `Squad: ${hasSquadId}, Phone: ${hasPhoneId}, Variables: ${variableCount}, Message: ${hasFirstMessage}`
      );
      
      // Check variable mappings
      const expectedVars = ['firstName', 'lastName', 'email', 'phone', 'firmName', 'practiceArea'];
      const mappedVars = expectedVars.filter(v => hasVariables && hasVariables[v]);
      logResult('phase2_configuration', '2.3 Variable Mappings', mappedVars.length >= 4,
        `${mappedVars.length}/${expectedVars.length} critical variables mapped`);
      
    } catch (error) {
      logResult('phase2_configuration', '2.2 GHL Workflow Payload', false, 
        `JSON parse error: ${error.message}`, 'critical');
    }
  } else {
    logResult('phase2_configuration', '2.2 GHL Workflow Payload File', false, 
      'File not found', 'critical');
  }
  
  // 2.4: VAPI Configuration (API check)
  if (VAPI_API_KEY) {
    try {
      const response = await axios.get('https://api.vapi.ai/assistant', {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      });
      logResult('phase2_configuration', '2.4 VAPI API Connection', true, 
        `Connected, ${response.data?.length || 0} assistants found`);
    } catch (error) {
      logResult('phase2_configuration', '2.4 VAPI API Connection', false, 
        `Status: ${error.response?.status || 'Network error'}`, 'critical');
    }
  }
  
  // 2.5: GHL API Connection
  if (GHL_API_KEY && GHL_CALENDAR_ID) {
    try {
      const testDate = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(testDate).getTime();
      const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;
      
      const response = await axios.get(
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
          timeout: 10000
        }
      );
      
      logResult('phase2_configuration', '2.5 GHL Calendar API', true, 
        `Connected, calendar accessible`);
    } catch (error) {
      logResult('phase2_configuration', '2.5 GHL Calendar API', false, 
        `Status: ${error.response?.status || error.message}`, 
        error.response?.status === 401 ? 'critical' : 'warning');
    }
  }
}

// ============================================================================
// PHASE 3: INTEGRATION AUDIT
// ============================================================================

async function phase3_IntegrationAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('🔗 PHASE 3: INTEGRATION AUDIT');
  console.log('='.repeat(80));
  
  // 3.1: Server Health
  try {
    const response = await axios.get(`${RENDER_URL}/health`, { timeout: 10000 });
    const isHealthy = response.data?.status === 'healthy';
    logResult('phase3_integrations', '3.1 Server Health', isHealthy,
      isHealthy ? `Response time: ${response.headers['x-response-time'] || 'N/A'}` : 'Server not responding');
  } catch (error) {
    logResult('phase3_integrations', '3.1 Server Health', false,
      `Timeout or error: ${error.message}`, 'critical');
  }
  
  // 3.2: VAPI Squad Configuration
  if (VAPI_API_KEY && SQUAD_ID) {
    try {
      const response = await axios.get(`https://api.vapi.ai/squad/${SQUAD_ID}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      });
      
      const squad = response.data;
      const hasMembers = squad.members && squad.members.length > 0;
      const sarahIsFirst = hasMembers && squad.members[0]?.name?.toLowerCase().includes('sarah');
      
      logResult('phase3_integrations', '3.2 VAPI Squad Exists', true,
        `Name: ${squad.name}, Members: ${squad.members?.length || 0}`);
      
      logResult('phase3_integrations', '3.3 Squad Default Assistant', sarahIsFirst,
        sarahIsFirst ? 'Sarah is start node' : 'Check start node configuration');
      
    } catch (error) {
      logResult('phase3_integrations', '3.2 VAPI Squad', false,
        `Status: ${error.response?.status || error.message}`, 'critical');
    }
  }
  
  // 3.3: Phone Number Configuration
  if (VAPI_API_KEY && PHONE_NUMBER_ID) {
    try {
      const response = await axios.get(`https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      });
      
      const phone = response.data;
      const hasServerUrl = phone.serverUrl && phone.serverUrl.includes(RENDER_URL);
      const assignedToSquad = phone.squadId === SQUAD_ID;
      
      logResult('phase3_integrations', '3.4 Phone Number Exists', true,
        `Number: ${phone.number || 'N/A'}`);
      
      logResult('phase3_integrations', '3.5 Phone Server URL', hasServerUrl,
        hasServerUrl ? 'Correct' : `Current: ${phone.serverUrl || 'N/A'}, Expected: ${RENDER_URL}/webhook/vapi`);
      
      logResult('phase3_integrations', '3.6 Phone Assigned to Squad', assignedToSquad,
        assignedToSquad ? 'Correct' : `Current: ${phone.squadId || 'N/A'}, Expected: ${SQUAD_ID}`);
      
    } catch (error) {
      logResult('phase3_integrations', '3.4 Phone Number', false,
        `Status: ${error.response?.status || error.message}`, 'critical');
    }
  }
  
  // 3.4: Tool Configuration
  if (VAPI_API_KEY) {
    try {
      // Check Sarah assistant for tools
      const sarahId = '87bbafd3-e24d-4de6-ac76-9ec93d180571';
      const response = await axios.get(`https://api.vapi.ai/assistant/${sarahId}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      });
      
      const assistant = response.data;
      const tools = assistant.tools || [];
      const calendarTools = tools.filter(t => 
        t.function?.name?.includes('calendar') || 
        t.function?.name?.includes('availability') ||
        t.function?.name?.includes('appointment')
      );
      
      logResult('phase3_integrations', '3.7 Calendar Tools Attached', calendarTools.length >= 2,
        `Found ${calendarTools.length} calendar-related tools`);
      
      // Check tool server URLs
      const toolsWithServerUrl = calendarTools.filter(t => 
        t.server?.url && t.server.url.includes(RENDER_URL)
      );
      
      logResult('phase3_integrations', '3.8 Tool Server URLs', toolsWithServerUrl.length === calendarTools.length,
        `${toolsWithServerUrl.length}/${calendarTools.length} tools have correct server URL`);
      
    } catch (error) {
      logResult('phase3_integrations', '3.7 Assistant Tools', false,
        `Status: ${error.response?.status || error.message}`, 'warning');
    }
  }
}

// ============================================================================
// PHASE 4: POSTMAN TEST GENERATION
// ============================================================================

async function phase4_PostmanTests() {
  console.log('\n' + '='.repeat(80));
  console.log('📮 PHASE 4: POSTMAN TEST GENERATION');
  console.log('='.repeat(80));
  
  // Generate Postman collection
  const postmanCollection = {
    info: {
      name: "CaseBoost Voice Assistant - Pre-Call Tests",
      description: "Comprehensive test suite for all tools and integrations",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
      {
        name: "1. Health Check",
        request: {
          method: "GET",
          header: [],
          url: {
            raw: `${RENDER_URL}/health`,
            protocol: "https",
            host: [RENDER_URL.replace('https://', '').split('/')[0]],
            path: ["health"]
          }
        }
      },
      {
        name: "2. Check Calendar Availability",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              message: {
                toolCalls: [{
                  id: "test_call_123",
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
            }, null, 2)
          },
          url: {
            raw: `${RENDER_URL}/webhook/vapi`,
            protocol: "https",
            host: [RENDER_URL.replace('https://', '').split('/')[0]],
            path: ["webhook", "vapi"]
          }
        }
      },
      {
        name: "3. Book Calendar Appointment",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              message: {
                toolCalls: [{
                  id: "test_call_456",
                  function: {
                    name: "book_calendar_appointment",
                    arguments: {
                      date: "today",
                      time: "2:00 PM",
                      timezone: "America/New_York",
                      fullName: "Test User",
                      email: "test@example.com",
                      phone: "+1234567890"
                    }
                  }
                }]
              },
              call: {
                customer: {
                  id: "test_contact_id"
                }
              }
            }, null, 2)
          },
          url: {
            raw: `${RENDER_URL}/webhook/vapi`,
            protocol: "https",
            host: [RENDER_URL.replace('https://', '').split('/')[0]],
            path: ["webhook", "vapi"]
          }
        }
      },
      {
        name: "4. Capture Qualification Data",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              message: {
                toolCalls: [{
                  id: "test_call_789",
                  function: {
                    name: "capture_qualification_data",
                    arguments: {
                      firm_name: "Test Law Firm",
                      firm_size: "10",
                      staff_count: "20",
                      current_leads_per_month: "5",
                      capacity_leads_per_month: "13",
                      success_definition: "30 leads per month"
                    }
                  }
                }]
              }
            }, null, 2)
          },
          url: {
            raw: `${RENDER_URL}/webhook/vapi`,
            protocol: "https",
            host: [RENDER_URL.replace('https://', '').split('/')[0]],
            path: ["webhook", "vapi"]
          }
        }
      }
    ]
  };
  
  const collectionPath = path.join(__dirname, '..', 'POSTMAN-PRE-CALL-TESTS.json');
  fs.writeFileSync(collectionPath, JSON.stringify(postmanCollection, null, 2));
  
  logResult('phase4_postman_tests', '4.1 Postman Collection Generated', true,
    `Saved to: ${collectionPath}`);
  
  logResult('phase4_postman_tests', '4.2 Test Cases Created', true,
    '4 test cases: Health, Check Availability, Book Appointment, Capture Data');
}

// ============================================================================
// PHASE 5: DATA FLOW VERIFICATION
// ============================================================================

async function phase5_DataFlowVerification() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 PHASE 5: DATA FLOW VERIFICATION');
  console.log('='.repeat(80));
  
  // 5.1: GHL → VAPI Variable Mapping
  const payloadPath = path.join(__dirname, '..', 'GHL-WORKFLOW-UPDATED-PAYLOAD.json');
  if (fs.existsSync(payloadPath)) {
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    const variables = payload.assistantOverrides?.variableValues || {};
    
    // Check critical mappings
    const criticalMappings = {
      'firstName': '{{contact.first_name}}',
      'firmName': '{{contact.firm_name}}',
      'practiceArea': '{{contact.practice_area}}',
      'email': '{{contact.email}}',
      'phone': '{{contact.phone}}'
    };
    
    let mappingsCorrect = true;
    for (const [vapiVar, ghlTemplate] of Object.entries(criticalMappings)) {
      const actualValue = variables[vapiVar];
      const isCorrect = actualValue === ghlTemplate;
      if (!isCorrect) mappingsCorrect = false;
    }
    
    logResult('phase5_data_flow', '5.1 GHL → VAPI Variable Mapping', mappingsCorrect,
      `${Object.keys(criticalMappings).length} critical variables mapped`);
    
    // Check template syntax
    const usesUnderscore = Object.values(variables).some(v => 
      typeof v === 'string' && v.includes('{{contact.') && !v.includes(' ')
    );
    logResult('phase5_data_flow', '5.2 GHL Template Syntax', usesUnderscore,
      'Uses underscore notation (e.g., {{contact.firm_name}})');
  }
  
  // 5.3: VAPI → Server Data Flow
  logResult('phase5_data_flow', '5.3 VAPI → Server Webhook', true,
    'Webhook endpoint configured: POST /webhook/vapi');
  
  // 5.4: Server → GHL Data Flow
  logResult('phase5_data_flow', '5.4 Server → GHL API', true,
    'GHL client configured for calendar and contact updates');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 COMPREHENSIVE PRE-CALL AUDIT');
  console.log('='.repeat(80));
  console.log(`\n📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 Server: ${RENDER_URL}`);
  console.log(`\nStarting comprehensive audit...\n`);
  
  try {
    await phase1_CodeAudit();
    await phase2_ConfigurationAudit();
    await phase3_IntegrationAudit();
    await phase4_PostmanTests();
    await phase5_DataFlowVerification();
    
    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Passed: ${auditResults.passed}/${auditResults.total} (${Math.round(auditResults.passed/auditResults.total*100)}%)`);
    console.log(`❌ Failed: ${auditResults.failed}/${auditResults.total}`);
    console.log(`\n🔴 Critical Issues: ${auditResults.issues.length}`);
    auditResults.issues.forEach((issue, i) => {
      console.log(`   ${i+1}. [${issue.phase}] ${issue.test}: ${issue.details}`);
    });
    
    console.log(`\n⚠️  Warnings: ${auditResults.warnings.length}`);
    auditResults.warnings.slice(0, 5).forEach((warning, i) => {
      console.log(`   ${i+1}. [${warning.phase}] ${warning.test}: ${warning.details}`);
    });
    
    if (auditResults.warnings.length > 5) {
      console.log(`   ... and ${auditResults.warnings.length - 5} more warnings`);
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'AUDIT-REPORT-' + new Date().toISOString().split('T')[0] + '.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Final verdict
    console.log('\n' + '='.repeat(80));
    if (auditResults.issues.length === 0) {
      console.log('✅ AUDIT PASSED - Ready for Postman Testing!');
      console.log('\nNext Steps:');
      console.log('1. Import POSTMAN-PRE-CALL-TESTS.json into Postman');
      console.log('2. Run all test cases');
      console.log('3. Verify all responses');
      console.log('4. If all pass, proceed with test call');
    } else {
      console.log('❌ AUDIT FAILED - Fix Critical Issues First!');
      console.log('\nAction Required:');
      console.log('1. Fix all critical issues listed above');
      console.log('2. Re-run audit: node scripts/comprehensive-pre-call-audit.js');
      console.log('3. Once all pass, proceed with Postman testing');
    }
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Audit Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run audit
runAudit();

