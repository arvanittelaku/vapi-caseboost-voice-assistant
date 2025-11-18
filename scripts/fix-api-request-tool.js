#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SEND_TOOL_ID = '73c76bdb-8d6d-4f7e-9688-5cd4be544573';

/**
 * Fix API Request tool default values
 * For apiRequest type tools, properties are in body.properties, not function.parameters.properties
 */
async function fixApiRequestTool() {
  console.log('🔧 Fixing send_info_case_boost (API Request Tool)...\n');

  // First, get current configuration
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

    console.log('Current tool structure:');
    console.log('  Type:', getResponse.data.type);
    console.log('  Has body:', !!getResponse.data.body);
    console.log('  Has function:', !!getResponse.data.function);
    
    if (getResponse.data.body?.properties) {
      const propCount = Object.keys(getResponse.data.body.properties).length;
      console.log(`  Body properties: ${propCount}\n`);
      
      // Show current defaults
      console.log('📋 Current Default Values:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      let index = 1;
      for (const [key, value] of Object.entries(getResponse.data.body.properties)) {
        if (index <= 5) {
          console.log(`${index}. ${key}:`);
          console.log(`   Current default: ${value.default || 'NOT SET'}`);
        }
        index++;
      }
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error fetching tool:', error.response?.data || error.message);
    process.exit(1);
  }

  // Now update with correct defaults
  const toolConfig = {
    type: 'apiRequest',
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
    console.log('Tool Name:', response.data.name);
    console.log('Tool Type:', response.data.type);
    
    // Verify the fix
    if (response.data.body?.properties) {
      console.log('\n✅ Verifying default values:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const props = response.data.body.properties;
      
      const checks = [
        { field: 'firm_name', expected: '.firm_name' },
        { field: 'firm_size', expected: '.firm_size' },
        { field: 'staff_count', expected: '.staff_count' },
        { field: 'contact_email', expected: '.contact_email' },
        { field: 'contact_phone', expected: '.contact_phone' },
        { field: 'practice_area', expected: '.practice_area' }
      ];

      let allCorrect = true;
      
      checks.forEach(check => {
        const defaultValue = props[check.field]?.default || 'NOT SET';
        const isCorrect = defaultValue.includes(check.expected);
        const status = isCorrect ? '✅' : '❌';
        
        console.log(`${status} ${check.field}: ${defaultValue}`);
        
        if (!isCorrect) {
          allCorrect = false;
        }
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (allCorrect) {
        console.log('🎉 SUCCESS! All default values are NOW UNIQUE!\n');
        console.log('🧪 NEXT STEPS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Go to VAPI Dashboard → Tools');
        console.log('2. Open send_info_case_boost tool');
        console.log('3. Check if UI now shows unique defaults (might still show bug)');
        console.log('4. Make a TEST CALL to Sarah');
        console.log('5. Answer qualification questions');
        console.log('6. Check GHL webhook - data should be correct now!');
        console.log('7. Ignore UI bug if real calls work correctly\n');
      } else {
        console.log('⚠️  Some defaults may not be correct');
        console.log('Run: node scripts/diagnose-tool-issue.js to check again\n');
      }
    }

  } catch (error) {
    console.error('❌ Error updating tool:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error('\n⚠️  Bad Request - Possible issues:');
        console.error('  - VAPI may not support default values in body.properties');
        console.error('  - Variable syntax might be wrong');
        console.error('  - Try without default values and let Sarah pass parameters manually');
      }
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the fix
fixApiRequestTool();

