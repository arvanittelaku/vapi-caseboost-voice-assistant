#!/usr/bin/env node
/**
 * Fix Sarah's Form Confirmation Behavior
 * Updates the prompt to properly handle missing/empty fields
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SARAH_ASSISTANT_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

async function updateSarahPrompt() {
  console.log('🔧 Fixing Sarah\'s Form Confirmation Behavior\n');
  console.log('='.repeat(60));
  
  try {
    // Get current assistant config
    console.log('📥 Fetching current Sarah configuration...');
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const currentAssistant = getResponse.data;
    const currentPrompt = currentAssistant.model.messages[0].content;
    
    console.log('✅ Current configuration retrieved\n');
    
    // Find and replace the Phase 2 section
    const oldPhase2 = `PHASE 2: CONFIRM FORM DATA (30-45 seconds)
────────────────────────────────────────────────

Say this as ONE confirmation (don't ask them to confirm each field individually):

"Perfect! Let me quickly confirm what you provided in the form, just to make sure I have everything correct:

I have you down as [first name] [last name] from [firm name], focused on [practice area] law in the [region] area. You mentioned you're currently handling about [cases monthly] cases per month with [firm size] in your team, and you have a marketing budget around [budget].

Is all of that accurate, or is there anything you'd like to update?"

Response Handling:
- IF they confirm → "Great! Thank you for confirming."
- IF they make corrections → "No problem, let me update that. What should I change?" [Listen and acknowledge]
- IF some fields are blank → Just skip mentioning those fields in your confirmation

Then proceed to Phase 3.`;

    const newPhase2 = `PHASE 2: CONFIRM FORM DATA (30-45 seconds)
────────────────────────────────────────────────

⚠️ CRITICAL: Only mention fields that have ACTUAL VALUES. Skip empty fields completely.

Say this as ONE confirmation (don't ask them to confirm each field individually):

"Perfect! Let me quickly confirm what you provided in the form, just to make sure I have everything correct:"

Then build your confirmation sentence using ONLY the fields that have values:

IF you have firstName AND lastName:
  → "I have you down as [firstName] [lastName]"
ELSE IF you have firstName only:
  → "I have you down as [firstName]"
ELSE:
  → Skip name confirmation entirely

IF you have firmName:
  → Add "from [firmName]"

IF you have practiceArea:
  → Add "focused on [practiceArea] law"

IF you have practiceRegion:
  → Add "in the [practiceRegion] area"

IF you have casesMonthly:
  → Add "You mentioned you're currently handling about [casesMonthly] cases per month"

IF you have firmSize:
  → Add "with [firmSize] in your team"

IF you have marketingBudget:
  → Add "and you have a marketing budget around [marketingBudget]"

EXAMPLE 1 (Most fields filled):
"I have you down as John Smith from Smith & Associates, focused on Personal Injury law in the New York area. You mentioned you're currently handling about 25 cases per month with 5-10 attorneys in your team, and you have a marketing budget around $5,000-$10,000."

EXAMPLE 2 (Few fields filled - only name and email):
"I have you down as Arvanit Telaku. Is all of that accurate, or is there anything you'd like to update?"

EXAMPLE 3 (Only name):
"Perfect! I have you down as Arvanit. Is there anything you'd like to update or add?"

After your confirmation, ask:
"Is all of that accurate, or is there anything you'd like to update?"

Response Handling:
- IF they confirm → "Great! Thank you for confirming."
- IF they make corrections → "No problem, let me update that. What should I change?" [Listen and acknowledge]
- IF they add new information → Acknowledge and note it for later

⚠️ NEVER say placeholder text like "[first name]", "[firm name]", etc. Only use actual values or skip the field entirely.

Then proceed to Phase 3.`;

    // Replace the Phase 2 section
    let updatedPrompt = currentPrompt;
    
    if (currentPrompt.includes('PHASE 2: CONFIRM FORM DATA')) {
      // Find the Phase 2 section and replace it
      const phase2Start = currentPrompt.indexOf('PHASE 2: CONFIRM FORM DATA');
      const phase3Start = currentPrompt.indexOf('PHASE 3: QUALIFICATION QUESTIONS');
      
      if (phase2Start !== -1 && phase3Start !== -1) {
        const beforePhase2 = currentPrompt.substring(0, phase2Start);
        const afterPhase3 = currentPrompt.substring(phase3Start);
        
        updatedPrompt = beforePhase2 + newPhase2 + '\n\n' + afterPhase3;
        console.log('✅ Phase 2 section found and will be replaced\n');
      } else {
        console.log('⚠️  Could not find exact Phase 2 boundaries, attempting replacement...\n');
        updatedPrompt = currentPrompt.replace(oldPhase2, newPhase2);
      }
    } else {
      console.log('⚠️  Phase 2 section not found in expected format\n');
      console.log('Will append new instructions instead...\n');
      // Append new instructions at the beginning
      updatedPrompt = newPhase2 + '\n\n' + currentPrompt;
    }
    
    // Update the assistant
    console.log('📤 Updating Sarah\'s prompt...');
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${SARAH_ASSISTANT_ID}`,
      {
        model: {
          ...currentAssistant.model,
          messages: [
            {
              role: 'system',
              content: updatedPrompt
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Sarah\'s prompt updated successfully!\n');
    console.log('='.repeat(60));
    console.log('📋 Changes Made:');
    console.log('   ✅ Added explicit instructions to skip empty fields');
    console.log('   ✅ Added examples for different scenarios');
    console.log('   ✅ Added warning to never use placeholder text');
    console.log('   ✅ Made confirmation adaptive based on available data\n');
    
    console.log('🎯 Next Steps:');
    console.log('1. Test with a contact that has few fields filled');
    console.log('2. Verify Sarah only mentions fields with actual values');
    console.log('3. Confirm she skips empty fields gracefully\n');
    
  } catch (error) {
    console.error('\n❌ Error updating Sarah\'s prompt:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

updateSarahPrompt();

