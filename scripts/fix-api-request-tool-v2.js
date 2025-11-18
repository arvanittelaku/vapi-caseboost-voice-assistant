#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SEND_TOOL_ID = '73c76bdb-8d6d-4f7e-9688-5cd4be544573';

/**
 * Fix API Request tool default values (v2)
 * Don't send 'type' field in PATCH request
 */
async function fixApiRequestTool() {
  console.log('🔧 Fixing send_info_case_boost (API Request Tool) v2...\n');

  // First, get current configuration
  let currentTool;
  try {
    console.log('📥 Fetching current tool configuration...\n');
    
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/tool/${SEND_TOOL_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    currentTool = getResponse.data;
    
    console.log('Current tool structure:');
    console.log('  Type:', currentTool.type);
    console.log('  Has body:', !!currentTool.body);
    
    if (currentTool.body?.properties) {
      const propCount = Object.keys(currentTool.body.properties).length;
      console.log(`  Body properties: ${propCount}\n`);
      
      // Check for the bug
      const defaults = Object.entries(currentTool.body.properties)
        .map(([key, value]) => ({ key, default: value.default }));
      
      console.log('📋 Current Default Values (first 8):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      defaults.slice(0, 8).forEach((item, index) => {
        console.log(`${index + 1}. ${item.key}:`);
        console.log(`   ${item.default || '(empty)'}`);
      });
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error fetching tool:', error.response?.data || error.message);
    process.exit(1);
  }

  // Now update - DON'T send 'type' field
  const toolConfig = {
    async: false,
    messages: [
      {
        type: 'request-start',
        content: ''
      }
    ],
    name: 'send_info_case_boost',
    description: 'Sends all captured qualification data and meeting details to GoHighLevel. Call this function immediately after calling capture_qualification_data.',
    server: {
      url: 'https://services.leadconnectorhq.com/hooks/UKQeWLNeecpm5LKghcxs/webhook-trigger/9eb1fd60-a074-4472-91ed-fe5641264ace',
      timeoutSeconds: 20
    },
    body: {
      type: 'object',
      properties: {
        // Contact Information - EACH with UNIQUE default
        contact_email: {
          type: 'string',
          description: 'Contact email address',
          default: '{{capture_qualification_data.contact_email}}'
        },
        contact_phone: {
          type: 'string',
          description: 'Contact phone number',
          default: '{{capture_qualification_data.contact_phone}}'
        },
        contact_first_name: {
          type: 'string',
          description: 'Contact first name',
          default: '{{capture_qualification_data.contact_first_name}}'
        },
        contact_last_name: {
          type: 'string',
          description: 'Contact last name',
          default: '{{capture_qualification_data.contact_last_name}}'
        },
        
        // Firm Information - EACH with UNIQUE default
        firm_name: {
          type: 'string',
          description: 'Law firm name',
          default: '{{capture_qualification_data.firm_name}}'
        },
        practice_area: {
          type: 'string',
          description: 'Primary practice area',
          default: '{{capture_qualification_data.practice_area}}'
        },
        firm_size: {
          type: 'string',
          description: 'Number of attorneys',
          default: '{{capture_qualification_data.firm_size}}'
        },
        
        // Qualification Answers - EACH with UNIQUE default
        current_leads_per_month: {
          type: 'string',
          description: 'Current number of leads per month',
          default: '{{capture_qualification_data.current_leads_per_month}}'
        },
        staff_count: {
          type: 'string',
          description: 'Total staff count',
          default: '{{capture_qualification_data.staff_count}}'
        },
        capacity_leads_per_month: {
          type: 'string',
          description: 'Maximum leads firm can handle per month',
          default: '{{capture_qualification_data.capacity_leads_per_month}}'
        },
        success_definition: {
          type: 'string',
          description: 'What success looks like',
          default: '{{capture_qualification_data.success_definition}}'
        },
        
        // Meeting Details - EACH with UNIQUE default
        meeting_requested: {
          type: 'boolean',
          description: 'Whether meeting was requested',
          default: false
        },
        meeting_date: {
          type: 'string',
          description: 'Meeting date',
          default: '{{capture_qualification_data.meeting_date}}'
        },
        meeting_time: {
          type: 'string',
          description: 'Meeting time',
          default: '{{capture_qualification_data.meeting_time}}'
        },
        meeting_timezone: {
          type: 'string',
          description: 'Meeting timezone',
          default: '{{capture_qualification_data.meeting_timezone}}'
        }
      }
    }
  };

  try {
    console.log('📤 Updating tool with correct default values...\n');
    
    const response = await axios.patch(
      `${VAPI_BASE_URL}/tool/${SEND_TOOL_ID}`,
      toolConfig,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Tool updated successfully!\n');
    console.log('Tool ID:', response.data.id);
    console.log('Tool Type:', response.data.type);
    
    // Verify the fix
    if (response.data.body?.properties) {
      console.log('\n✅ Verifying NEW default values:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const props = response.data.body.properties;
      
      const checks = [
        { field: 'firm_name', expected: '.firm_name}' },
        { field: 'firm_size', expected: '.firm_size}' },
        { field: 'staff_count', expected: '.staff_count}' },
        { field: 'contact_email', expected: '.contact_email}' },
        { field: 'contact_phone', expected: '.contact_phone}' },
        { field: 'contact_first_name', expected: '.contact_first_name}' },
        { field: 'contact_last_name', expected: '.contact_last_name}' },
        { field: 'practice_area', expected: '.practice_area}' }
      ];

      let allCorrect = true;
      let correctCount = 0;
      
      checks.forEach(check => {
        const defaultValue = props[check.field]?.default || 'NOT SET';
        const isCorrect = defaultValue.includes(check.expected);
        const status = isCorrect ? '✅' : '❌';
        
        if (isCorrect) correctCount++;
        else allCorrect = false;
        
        console.log(`${status} ${check.field}:`);
        console.log(`   ${defaultValue}`);
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log(`📊 Result: ${correctCount}/${checks.length} fields have unique defaults\n`);

      if (allCorrect) {
        console.log('🎉 SUCCESS! All default values are NOW UNIQUE!\n');
        console.log('🧪 NEXT STEPS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Make a TEST CALL to Sarah');
        console.log('2. Go through qualification conversation:');
        console.log('   - Firm name: "Test Firm"');
        console.log('   - Firm size: "5-10"');
        console.log('   - Staff count: "8"');
        console.log('   - Current leads: "10"');
        console.log('   - Capacity: "25"');
        console.log('3. Check GHL webhook - you should see:');
        console.log('   ✅ firm_name: "Test Firm" (not "Smith & Associates")');
        console.log('   ✅ firm_size: "5-10" (not "Smith & Associates")');
        console.log('   ✅ staff_count: "8" (not "Smith & Associates")');
        console.log('4. If data is correct → Problem solved! 🎉');
        console.log('5. Ignore VAPI UI if it still shows the bug\n');
      } else {
        console.log('⚠️  Some defaults may not be correct');
        console.log('The backend is updated, but might need manual adjustment in UI\n');
        console.log('🧪 Test with a real call anyway - it might still work!\n');
      }
    }

  } catch (error) {
    console.error('❌ Error updating tool:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error('\n⚠️  Bad Request - Details:');
        if (error.response.data.message) {
          if (Array.isArray(error.response.data.message)) {
            error.response.data.message.forEach(msg => {
              console.error(`  - ${msg}`);
            });
          } else {
            console.error(`  - ${error.response.data.message}`);
          }
        }
        console.error('\n💡 This might mean:');
        console.error('  - VAPI API changed structure for apiRequest tools');
        console.error('  - Default values need to be set via UI only');
        console.error('  - We need to use a different approach\n');
      }
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the fix
fixApiRequestTool();

