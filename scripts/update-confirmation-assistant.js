#!/usr/bin/env node

/**
 * Script to update the Confirmation Assistant via Vapi API
 * Run: node scripts/update-confirmation-assistant.js
 */

require('dotenv').config();
const axios = require('axios');
const CONFIRMATION_CONFIG = require('../src/config/confirmation-assistant.config');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CONFIRMATION_ASSISTANT_ID = process.env.VAPI_CONFIRMATION_ASSISTANT_ID || 'b6bcfa8e-d02b-4bc1-b6d3-2f284a8f7d1a';
const CONFIRMATION_PHONE_NUMBER_ID = process.env.VAPI_CONFIRMATION_PHONE_NUMBER_ID || 'a6818a6f-32af-4d4a-9814-1d388d366b01';

if (!VAPI_API_KEY) {
  console.error('❌ VAPI_API_KEY not found in environment variables');
  process.exit(1);
}

const vapiClient = axios.create({
  baseURL: 'https://api.vapi.ai',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function updateConfirmationAssistant() {
  try {
    console.log('🔧 Updating Confirmation Assistant...');
    console.log(`📋 Assistant ID: ${CONFIRMATION_ASSISTANT_ID}`);
    
    // Prepare assistant update payload
    // Note: System prompt needs to be updated manually in Vapi UI (API doesn't support it yet)
    const updatePayload = {
      name: CONFIRMATION_CONFIG.name,
      model: CONFIRMATION_CONFIG.model,
      voice: CONFIRMATION_CONFIG.voice,
      firstMessage: CONFIRMATION_CONFIG.firstMessage,
      endCallMessage: CONFIRMATION_CONFIG.endCallMessage,
      endCallPhrases: CONFIRMATION_CONFIG.endCallPhrases,
      maxDurationSeconds: CONFIRMATION_CONFIG.maxDurationSeconds,
      backgroundSound: CONFIRMATION_CONFIG.backgroundSound,
      backchannelingEnabled: CONFIRMATION_CONFIG.backchannelingEnabled,
      silenceTimeoutSeconds: CONFIRMATION_CONFIG.silenceTimeoutSeconds,
      serverUrl: process.env.SERVER_URL || "https://vapi-caseboost-voice-assistant.onrender.com/webhook/vapi",
      serverUrlSecret: process.env.VAPI_SERVER_SECRET || "",
      tools: CONFIRMATION_CONFIG.tools, // Include tools in main payload
    };
    
    console.log('\n📝 NOTE: System prompt must be updated manually in Vapi UI');
    console.log('   The system prompt is ready in: src/config/confirmation-assistant.config.js');
    
    // Update assistant
    const response = await vapiClient.patch(`/assistant/${CONFIRMATION_ASSISTANT_ID}`, updatePayload);
    console.log('✅ Assistant updated successfully!');
    console.log(`   Name: ${response.data.name}`);
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Tools configured: ${CONFIRMATION_CONFIG.tools.length}`);
    
    // Assign phone number to assistant
    console.log('\n📞 Assigning phone number to assistant...');
    
    try {
      const phoneUpdatePayload = {
        assistantId: CONFIRMATION_ASSISTANT_ID
      };
      
      await vapiClient.patch(`/phone-number/${CONFIRMATION_PHONE_NUMBER_ID}`, phoneUpdatePayload);
      console.log(`✅ Phone number ${CONFIRMATION_PHONE_NUMBER_ID} assigned to assistant!`);
    } catch (phoneError) {
      console.error('⚠️  Phone number assignment failed:', phoneError.response?.data?.message || phoneError.message);
      console.log('   You may need to assign it manually in the Vapi dashboard');
    }
    
    console.log('\n✅ Configuration complete!');
    console.log('\n📋 Summary:');
    console.log(`   Assistant ID: ${CONFIRMATION_ASSISTANT_ID}`);
    console.log(`   Phone Number ID: ${CONFIRMATION_PHONE_NUMBER_ID}`);
    console.log(`   Tools: ${CONFIRMATION_CONFIG.tools.length}`);
    console.log(`   - update_appointment_status_caseboost`);
    console.log(`   - check_calendar_availability_caseboost`);
    console.log(`   - book_calendar_appointment_caseboost`);
    
  } catch (error) {
    console.error('❌ Error updating assistant:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.error('\n💡 Assistant ID not found. Please verify:');
      console.error(`   - VAPI_CONFIRMATION_ASSISTANT_ID in .env`);
      console.error(`   - Current value: ${CONFIRMATION_ASSISTANT_ID}`);
    }
    
    process.exit(1);
  }
}

// Run the update
updateConfirmationAssistant();

