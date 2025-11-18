#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

/**
 * Create capture_qualification_data Function Tool
 * This tool captures all conversation data and returns it for use by other tools
 */
async function createCaptureTool() {
  console.log('🔧 Creating capture_qualification_data Function Tool...\n');

  const toolConfig = {
    type: 'function',
    async: false,
    messages: [],
    function: {
      name: 'capture_qualification_data',
      description: 'Captures all qualification data, contact information, and meeting details from the conversation. Call this function after collecting all required information from the prospect.',
      parameters: {
        type: 'object',
        properties: {
          // Contact Information (from GHL form)
          contact_email: {
            type: 'string',
            description: 'Contact email address from form'
          },
          contact_phone: {
            type: 'string',
            description: 'Contact phone number from form'
          },
          contact_first_name: {
            type: 'string',
            description: 'Contact first name from form'
          },
          contact_last_name: {
            type: 'string',
            description: 'Contact last name from form'
          },
          
          // Firm Information (from GHL form)
          firm_name: {
            type: 'string',
            description: 'Law firm name from form'
          },
          practice_area: {
            type: 'string',
            description: 'Primary practice area from form'
          },
          firm_size: {
            type: 'string',
            description: 'Number of attorneys from form'
          },
          
          // Qualification Answers (from conversation)
          current_leads_per_month: {
            type: 'string',
            description: 'Current number of leads the firm receives per month (from conversation)'
          },
          staff_count: {
            type: 'string',
            description: 'Total number of staff members (from conversation)'
          },
          capacity_leads_per_month: {
            type: 'string',
            description: 'Maximum number of leads the firm can handle per month (from conversation)'
          },
          success_definition: {
            type: 'string',
            description: 'What success looks like for the firm (from conversation)'
          },
          
          // Meeting Details (from conversation)
          meeting_requested: {
            type: 'boolean',
            description: 'Whether the prospect requested a meeting'
          },
          meeting_date: {
            type: 'string',
            description: 'Preferred meeting date'
          },
          meeting_time: {
            type: 'string',
            description: 'Preferred meeting time'
          },
          meeting_timezone: {
            type: 'string',
            description: 'Prospect timezone'
          }
        },
        required: ['contact_email', 'contact_phone', 'current_leads_per_month', 'staff_count', 'capacity_leads_per_month']
      }
    }
  };

  try {
    console.log('📤 Creating tool in Vapi...');
    
    const response = await axios.post(
      `${VAPI_BASE_URL}/tool`,
      toolConfig,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Capture tool created successfully!\n');
    console.log('Tool ID:', response.data.id);
    console.log('Tool Name:', response.data.function.name);
    console.log('Tool Type: Function Tool (returns data for other tools to use)');
    
    console.log('\n📋 Save this Tool ID:');
    console.log(`CAPTURE_TOOL_ID=${response.data.id}`);
    console.log('\nAdd it to your .env file!');
    
    return response.data.id;

  } catch (error) {
    console.error('❌ Error creating tool:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n⚠️ Authentication failed. Check your VAPI_API_KEY in .env file');
    }
    
    process.exit(1);
  }
}

// Run the creation
createCaptureTool();

