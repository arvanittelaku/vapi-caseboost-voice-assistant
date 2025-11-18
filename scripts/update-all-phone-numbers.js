#!/usr/bin/env node
/**
 * Update All Phone Number Server URLs
 * Automatically updates all phone numbers to point to Render server
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const EXPECTED_SERVER_URL = `${RENDER_URL}/webhook/vapi`;

async function updateAllPhoneNumbers() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📞 Updating All Phone Number Server URLs');
    console.log('='.repeat(80));
    console.log(`\nTarget Server URL: ${EXPECTED_SERVER_URL}\n`);
    
    // Fetch all phone numbers
    console.log('📞 Fetching phone numbers...\n');
    const response = await axios.get(
      `${VAPI_BASE_URL}/phone-number`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const phoneNumbers = response.data;
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log('⚠️  No phone numbers found\n');
      return;
    }
    
    console.log(`✅ Found ${phoneNumbers.length} phone number(s)\n`);
    
    // Filter phone numbers that need updating
    const needsUpdate = phoneNumbers.filter(phone => 
      !phone.serverUrl || phone.serverUrl !== EXPECTED_SERVER_URL
    );
    
    if (needsUpdate.length === 0) {
      console.log('✅ All phone numbers are already correctly configured!\n');
      return;
    }
    
    console.log(`📋 Updating ${needsUpdate.length} phone number(s)...\n`);
    
    const results = [];
    
    // Update each phone number
    for (const phone of needsUpdate) {
      try {
        console.log(`Updating ${phone.number || phone.phoneNumber || 'N/A'}...`);
        
        const updateResponse = await axios.patch(
          `${VAPI_BASE_URL}/phone-number/${phone.id}`,
          {
            serverUrl: EXPECTED_SERVER_URL
          },
          {
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`   ✅ Updated successfully`);
        console.log(`   Server URL: ${updateResponse.data.serverUrl}\n`);
        
        results.push({ phone: phone.number || phone.phoneNumber, success: true });
      } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}\n`);
        results.push({ 
          phone: phone.number || phone.phoneNumber, 
          success: false,
          error: error.response?.data?.message || error.message
        });
      }
    }
    
    // Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY\n');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successfully updated: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.phone}: ${r.error}`);
      });
    }
    console.log('');
    
    if (successful === needsUpdate.length) {
      console.log('🎉 All phone numbers updated successfully!\n');
    } else if (successful > 0) {
      console.log('⚠️  Some phone numbers were updated, but some failed.\n');
    } else {
      console.log('❌ No phone numbers were updated. Please check errors above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.response?.data || error.message);
    process.exit(1);
  }
}

updateAllPhoneNumbers();

