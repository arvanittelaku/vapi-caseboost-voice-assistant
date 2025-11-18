#!/usr/bin/env node
/**
 * Update Case Boost Phone Number Server URL
 * Updates only the Case Boost phone number(s) to point to Render server
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const RENDER_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-caseboost-voice-assistant.onrender.com';
const EXPECTED_SERVER_URL = `${RENDER_URL}/webhook/vapi`;

// Case Boost phone number identifiers (by label or number)
const CASEBOOST_LABELS = ['CaseBoost', 'Case Boost', 'caseboost', 'case boost'];
const CASEBOOST_NUMBERS = ['+12136721526', '+16144076131']; // Based on your dashboard

async function updateCaseBoostPhoneNumbers() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📞 Updating Case Boost Phone Number Server URL');
    console.log('='.repeat(80));
    console.log(`\nTarget Server URL: ${EXPECTED_SERVER_URL}\n`);
    
    // Fetch all phone numbers
    console.log('📞 Fetching phone numbers from VAPI...\n');
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
    
    // Find Case Boost phone numbers
    const caseBoostPhones = phoneNumbers.filter(phone => {
      const number = phone.number || phone.phoneNumber || '';
      const label = phone.label || '';
      
      // Check by label
      const matchesLabel = CASEBOOST_LABELS.some(cbLabel => 
        label.toLowerCase().includes(cbLabel.toLowerCase())
      );
      
      // Check by number
      const matchesNumber = CASEBOOST_NUMBERS.some(cbNum => 
        number.replace(/\D/g, '') === cbNum.replace(/\D/g, '')
      );
      
      return matchesLabel || matchesNumber;
    });
    
    if (caseBoostPhones.length === 0) {
      console.log('⚠️  No Case Boost phone numbers found\n');
      console.log('Available phone numbers:');
      phoneNumbers.forEach(phone => {
        console.log(`   - ${phone.number || phone.phoneNumber} (${phone.label || 'Unlabeled'})`);
      });
      return;
    }
    
    console.log(`✅ Found ${caseBoostPhones.length} Case Boost phone number(s):\n`);
    caseBoostPhones.forEach((phone, index) => {
      console.log(`${index + 1}. ${phone.number || phone.phoneNumber}`);
      console.log(`   Label: ${phone.label || 'Unlabeled'}`);
      console.log(`   Current Server URL: ${phone.serverUrl || 'NOT SET'}`);
      console.log(`   Status: ${phone.serverUrl === EXPECTED_SERVER_URL ? '✅ CORRECT' : '❌ NEEDS UPDATE'}\n`);
    });
    
    // Filter phones that need updating
    const needsUpdate = caseBoostPhones.filter(phone => 
      !phone.serverUrl || phone.serverUrl !== EXPECTED_SERVER_URL
    );
    
    if (needsUpdate.length === 0) {
      console.log('✅ All Case Boost phone numbers are already correctly configured!\n');
      return;
    }
    
    console.log(`📋 Updating ${needsUpdate.length} phone number(s)...\n`);
    
    const results = [];
    
    // Update each phone number
    for (const phone of needsUpdate) {
      try {
        console.log(`Updating ${phone.number || phone.phoneNumber} (${phone.label || 'Unlabeled'})...`);
        console.log(`   From: ${phone.serverUrl || 'NOT SET'}`);
        console.log(`   To: ${EXPECTED_SERVER_URL}`);
        
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
        
        console.log(`   ✅ Updated successfully!\n`);
        
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
      console.log('🎉 Case Boost phone number(s) updated successfully!\n');
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

updateCaseBoostPhoneNumbers();

