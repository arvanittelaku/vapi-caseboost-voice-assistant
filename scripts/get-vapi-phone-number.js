#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

async function getPhoneNumbers() {
  console.log('🔍 Fetching your VAPI phone numbers...\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/phone-number`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Phone numbers found:\n');
    
    response.data.forEach((phone, index) => {
      console.log(`📞 Phone Number ${index + 1}:`);
      console.log(`   ID: ${phone.id}`);
      console.log(`   Number: ${phone.number || 'N/A'}`);
      console.log(`   Provider: ${phone.provider || 'N/A'}`);
      console.log(`   Name: ${phone.name || 'Unnamed'}`);
      console.log('');
    });

    if (response.data.length > 0) {
      console.log('💡 Copy one of these IDs and use it in your GHL webhook!\n');
    } else {
      console.log('⚠️  No phone numbers found. You need to add a phone number in VAPI dashboard first.\n');
    }

  } catch (error) {
    console.error('❌ Failed to fetch phone numbers:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

getPhoneNumbers();

