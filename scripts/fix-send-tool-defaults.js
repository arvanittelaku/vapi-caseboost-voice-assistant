#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SEND_TOOL_ID = '73c76bdb-8d6d-4f7e-9688-5cd4be544573';

/**
 * Fix send_info_case_boost tool to properly reference captured data
 * This sets INDIVIDUAL default values for EACH property
 */
async function fixSendToolDefaults() {
  console.log('🔧 Fixing send_info_case_boost default values...\n');
  console.log('This will set UNIQUE default values for each property\n');

  // CRITICAL: Each property must have its OWN unique default value
  const toolConfig = {
    type: 'output',
    async: false,
    messages: [
      {
        type: 'request-start',
        content: ''
      }
    ],
    function: {
      name: 'send_info_case_boost',
      description: 'Sends all captured qualification data and meeting details to GoHighLevel. Call this function immediately after calling capture_qualification_data.',
      parameters: {
        type: 'object',
        properties: {
          // Contact Information - EACH with unique default
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
          
          // Firm Information - EACH with unique default
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
          
          // Qualification Answers - EACH with unique default
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
          
          // Meeting Details - EACH with unique default
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
        },
        required: ['contact_email', 'contact_phone', 'current_leads_per_month', 'staff_count', 'capacity_leads_per_month']
      }
    },
    server: {
      url: 'https://services.leadconnectorhq.com/hooks/UKQeWLNeecpm5LKghcxs/webhook-trigger/9eb1fd60-a074-4472-91ed-fe5641264ace',
      timeoutSeconds: 20
    }
  };

  try {
    console.log('📤 Updating send tool with proper default values...');
    
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

    console.log('✅ Send tool updated successfully!\n');
    console.log('Tool ID:', response.data.id);
    console.log('Tool Name:', response.data.function.name);
    
    console.log('\n✅ Verifying default values were set correctly:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const props = response.data.function.parameters.properties;
    
    // Verify each field has unique default
    const checks = [
      { field: 'contact_email', expected: 'contact_email' },
      { field: 'contact_phone', expected: 'contact_phone' },
      { field: 'firm_name', expected: 'firm_name' },
      { field: 'firm_size', expected: 'firm_size' },
      { field: 'staff_count', expected: 'staff_count' },
      { field: 'practice_area', expected: 'practice_area' },
      { field: 'current_leads_per_month', expected: 'current_leads_per_month' },
      { field: 'capacity_leads_per_month', expected: 'capacity_leads_per_month' }
    ];

    let allCorrect = true;
    
    checks.forEach(check => {
      const defaultValue = props[check.field]?.default || 'NOT SET';
      const isCorrect = defaultValue.includes(check.expected);
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} ${check.field}:`);
      console.log(`   Default: ${defaultValue}`);
      
      if (!isCorrect) {
        allCorrect = false;
        console.log(`   ⚠️  Expected to contain: ${check.expected}`);
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allCorrect) {
      console.log('🎉 SUCCESS! All default values are set correctly!\n');
      console.log('🎯 Next Steps:');
      console.log('1. Make a test call to Sarah');
      console.log('2. Answer qualification questions');
      console.log('3. Check GHL webhook for received data');
      console.log('4. Verify ALL fields have correct values (not all "Smith & Associates")\n');
    } else {
      console.log('⚠️  WARNING: Some default values may not be set correctly');
      console.log('This could be due to VAPI API limitations');
      console.log('Try running this script again or contact VAPI support\n');
    }

  } catch (error) {
    console.error('❌ Error updating tool:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n⚠️ Authentication failed. Check your VAPI_API_KEY in .env file');
      } else if (error.response.status === 400) {
        console.error('\n⚠️ Invalid request. Possible issues:');
        console.error('  - Default values not supported in this tool type');
        console.error('  - Invalid reference syntax');
        console.error('  - Tool type needs to be "output" not "function"');
      }
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the fix
fixSendToolDefaults();

