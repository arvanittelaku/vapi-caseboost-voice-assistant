#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SEND_TOOL_ID = '73c76bdb-8d6d-4f7e-9688-5cd4be544573';

/**
 * Update send_info_case_boost to use captured data from capture_qualification_data
 */
async function updateSendTool() {
  console.log('🔧 Updating send_info_case_boost to use capture_qualification_data...\n');

  const toolConfig = {
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
          // Contact Information - reference captured data
          contact_email: {
            type: 'string',
            description: 'Contact email address'
          },
          contact_phone: {
            type: 'string',
            description: 'Contact phone number'
          },
          contact_first_name: {
            type: 'string',
            description: 'Contact first name'
          },
          contact_last_name: {
            type: 'string',
            description: 'Contact last name'
          },
          
          // Firm Information - reference captured data
          firm_name: {
            type: 'string',
            description: 'Law firm name'
          },
          practice_area: {
            type: 'string',
            description: 'Primary practice area'
          },
          firm_size: {
            type: 'string',
            description: 'Number of attorneys'
          },
          
          // Qualification Answers - reference captured data
          current_leads_per_month: {
            type: 'string',
            description: 'Current number of leads per month'
          },
          staff_count: {
            type: 'string',
            description: 'Total staff count'
          },
          capacity_leads_per_month: {
            type: 'string',
            description: 'Maximum leads firm can handle per month'
          },
          success_definition: {
            type: 'string',
            description: 'What success looks like'
          },
          
          // Meeting Details - reference captured data
          meeting_requested: {
            type: 'boolean',
            description: 'Whether meeting was requested'
          },
          meeting_date: {
            type: 'string',
            description: 'Meeting date'
          },
          meeting_time: {
            type: 'string',
            description: 'Meeting time'
          },
          meeting_timezone: {
            type: 'string',
            description: 'Meeting timezone'
          }
        },
        required: ['contact_email', 'contact_phone', 'current_leads_per_month', 'staff_count', 'capacity_leads_per_month']
      }
    },
    server: {
      url: 'https://services.leadconnectorhq.com/hooks/UKQeWLNeecpm5LKghcxs/webhook-trigger/9eb1fd60-a074-4472-91ed-fe5641264ace',
      timeoutSeconds: 20,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  };

  try {
    console.log('📤 Updating send tool...');
    
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
    console.log('\n✅ Default values now reference capture_qualification_data:');
    console.log('  contact_email:', response.data.function.parameters.properties.contact_email.default);
    console.log('  firm_name:', response.data.function.parameters.properties.firm_name.default);
    console.log('  current_leads_per_month:', response.data.function.parameters.properties.current_leads_per_month.default);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Update Sarah\'s prompt to call BOTH tools in sequence:');
    console.log('   a) First: capture_qualification_data()');
    console.log('   b) Then: send_info_case_boost()');
    console.log('2. Test with a real call');

  } catch (error) {
    console.error('❌ Error updating tool:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n⚠️ Authentication failed. Check your VAPI_API_KEY in .env file');
    }
    
    process.exit(1);
  }
}

// Run the update
updateSendTool();

