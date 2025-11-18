#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const TOOL_ID = '73c76bdb-8d6d-4f7e-9688-5cd4be544573';

/**
 * Update the send_info_case_boost tool with correct default values
 */
async function updateVapiTool() {
  console.log('🔧 Updating Vapi Tool: send_info_case_boost...\n');

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
      description: 'Updates the contact in GoHighLevel with qualification answers and meeting details gathered during the call. Call this function after collecting all the required information from the prospect.',
      parameters: {
        type: 'object',
        properties: {
          // Contact Information
          contact_email: {
            type: 'string',
            description: 'Contact email address',
            default: 'john@smithlaw.com'
          },
          contact_phone: {
            type: 'string',
            description: 'Contact phone number in E.164 format',
            default: '+12132127052'
          },
          contact_first_name: {
            type: 'string',
            description: 'Contact first name',
            default: 'John'
          },
          contact_last_name: {
            type: 'string',
            description: 'Contact last name',
            default: 'Smith'
          },
          
          // Firm Information
          firm_name: {
            type: 'string',
            description: 'Law firm name',
            default: 'Smith & Associates'
          },
          practice_area: {
            type: 'string',
            description: 'Primary practice area',
            default: 'Personal Injury'
          },
          firm_size: {
            type: 'string',
            description: 'Number of attorneys in the firm',
            default: '2-5 attorneys'
          },
          
          // Qualification Answers
          current_leads_per_month: {
            type: 'string',
            description: 'Current number of leads the firm receives per month',
            default: '50'
          },
          staff_count: {
            type: 'string',
            description: 'Total number of staff members',
            default: '11'
          },
          capacity_leads_per_month: {
            type: 'string',
            description: 'Maximum number of leads the firm can handle per month',
            default: '100'
          },
          success_definition: {
            type: 'string',
            description: 'What success looks like for the firm',
            default: 'Double case volume in 90 days'
          },
          
          // Meeting Details
          meeting_requested: {
            type: 'boolean',
            description: 'Whether the prospect requested a meeting',
            default: true
          },
          meeting_date: {
            type: 'string',
            description: 'Preferred meeting date',
            default: 'October 25, 2025'
          },
          meeting_time: {
            type: 'string',
            description: 'Preferred meeting time',
            default: '2:00 PM'
          },
          meeting_timezone: {
            type: 'string',
            description: 'Prospect timezone',
            default: 'America/New_York'
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
    console.log('📤 Sending update request to Vapi API...');
    
    const response = await axios.patch(
      `${VAPI_BASE_URL}/tool/${TOOL_ID}`,
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
    console.log('Tool Name:', response.data.function.name);
    console.log('\n📋 Default Values Set:');
    console.log('  contact_email:', response.data.function.parameters.properties.contact_email.default);
    console.log('  contact_phone:', response.data.function.parameters.properties.contact_phone.default);
    console.log('  contact_first_name:', response.data.function.parameters.properties.contact_first_name.default);
    console.log('  contact_last_name:', response.data.function.parameters.properties.contact_last_name.default);
    console.log('  firm_name:', response.data.function.parameters.properties.firm_name.default);
    console.log('  practice_area:', response.data.function.parameters.properties.practice_area.default);
    console.log('  firm_size:', response.data.function.parameters.properties.firm_size.default);
    console.log('  current_leads_per_month:', response.data.function.parameters.properties.current_leads_per_month.default);
    console.log('  staff_count:', response.data.function.parameters.properties.staff_count.default);
    console.log('  capacity_leads_per_month:', response.data.function.parameters.properties.capacity_leads_per_month.default);
    console.log('  success_definition:', response.data.function.parameters.properties.success_definition.default);
    console.log('  meeting_requested:', response.data.function.parameters.properties.meeting_requested.default);
    console.log('  meeting_date:', response.data.function.parameters.properties.meeting_date.default);
    console.log('  meeting_time:', response.data.function.parameters.properties.meeting_time.default);
    console.log('  meeting_timezone:', response.data.function.parameters.properties.meeting_timezone.default);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Go to Vapi dashboard and refresh the tool page');
    console.log('2. Click "Test Tool" to verify all default values are correct');
    console.log('3. The JSON should now show unique values for each field');

  } catch (error) {
    console.error('❌ Error updating tool:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n⚠️ Authentication failed. Check your VAPI_API_KEY in .env file');
    }
    
    if (error.response?.status === 404) {
      console.error('\n⚠️ Tool not found. Check the TOOL_ID is correct');
    }
    
    process.exit(1);
  }
}

// Run the update
updateVapiTool();

