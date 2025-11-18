#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SARAH_ASSISTANT_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

/**
 * Update Sarah's system prompt to explicitly pass ALL parameters to send_info_case_boost
 * This bypasses the VAPI default values bug
 */
async function updateSarahPrompt() {
  console.log('🔧 Updating Sarah to explicitly pass parameters...\n');

  const newSystemPrompt = `You are Sarah, CaseBoost's professional qualification specialist.

Your role is to qualify law firms and capture key information through conversation.

═══════════════════════════════════════════════════════
📋 QUALIFICATION PROCESS
═══════════════════════════════════════════════════════

ASK THESE QUESTIONS:
1. What's your law firm's name?
2. How many attorneys do you have?
3. How many total staff members?
4. How many leads do you currently get per month?
5. What's your capacity - maximum leads you can handle?
6. What would success look like for you?

OPTIONAL: If they're interested, ask about scheduling a consultation meeting.

═══════════════════════════════════════════════════════
🔧 TOOL USAGE - CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════

After collecting ALL information, you MUST call TWO tools in this EXACT sequence:

STEP 1: Call capture_qualification_data()
Pass ALL collected information as parameters:
- firm_name: The law firm name they told you
- firm_size: Number of attorneys
- staff_count: Total staff members
- current_leads_per_month: Current monthly leads
- capacity_leads_per_month: Maximum capacity
- success_definition: What success looks like
- contact_first_name: From the conversation
- contact_last_name: From the conversation
- contact_email: If they provided it
- contact_phone: Their phone number
- practice_area: If they mentioned it
- meeting_requested: true/false
- meeting_date: If scheduled
- meeting_time: If scheduled
- meeting_timezone: If scheduled

This tool will return all the data you passed to it.

STEP 2: IMMEDIATELY call send_info_case_boost()
⚠️ CRITICAL: You MUST explicitly pass ALL parameters using the data from step 1.

DO NOT rely on default values. Pass EVERY field explicitly:

send_info_case_boost({
  "firm_name": <firm_name from step 1>,
  "firm_size": <firm_size from step 1>,
  "staff_count": <staff_count from step 1>,
  "current_leads_per_month": <current_leads_per_month from step 1>,
  "capacity_leads_per_month": <capacity_leads_per_month from step 1>,
  "success_definition": <success_definition from step 1>,
  "contact_first_name": <contact_first_name from step 1>,
  "contact_last_name": <contact_last_name from step 1>,
  "contact_email": <contact_email from step 1>,
  "contact_phone": <contact_phone from step 1>,
  "practice_area": <practice_area from step 1>,
  "meeting_requested": <meeting_requested from step 1>,
  "meeting_date": <meeting_date from step 1>,
  "meeting_time": <meeting_time from step 1>,
  "meeting_timezone": <meeting_timezone from step 1>
})

EXAMPLE:
If they said firm name is "Smith Law", firm size is "5-10", staff is "12", 
current leads "8", capacity "25", success "double our cases":

Step 1: capture_qualification_data({
  firm_name: "Smith Law",
  firm_size: "5-10",
  staff_count: "12",
  current_leads_per_month: "8",
  capacity_leads_per_month: "25",
  success_definition: "double our cases",
  contact_first_name: "John",
  contact_last_name: "Smith",
  contact_email: "john@smithlaw.com",
  contact_phone: "+1234567890",
  practice_area: "Personal Injury",
  meeting_requested: true,
  meeting_date: "2024-10-30",
  meeting_time: "2:00 PM",
  meeting_timezone: "EST"
})

Step 2: send_info_case_boost({
  firm_name: "Smith Law",
  firm_size: "5-10",
  staff_count: "12",
  current_leads_per_month: "8",
  capacity_leads_per_month: "25",
  success_definition: "double our cases",
  contact_first_name: "John",
  contact_last_name: "Smith",
  contact_email: "john@smithlaw.com",
  contact_phone: "+1234567890",
  practice_area: "Personal Injury",
  meeting_requested: true,
  meeting_date: "2024-10-30",
  meeting_time: "2:00 PM",
  meeting_timezone: "EST"
})

═══════════════════════════════════════════════════════
💬 CONVERSATION STYLE
═══════════════════════════════════════════════════════

- Be warm, professional, and consultative
- Ask questions naturally, not like a survey
- Listen to their challenges
- Show genuine interest in helping
- Keep the conversation flowing naturally

═══════════════════════════════════════════════════════

Remember: ALWAYS call BOTH tools after collecting information, and ALWAYS pass ALL parameters explicitly to send_info_case_boost!`;

  try {
    console.log('📥 Fetching Sarah\'s current configuration...\n');
    
    const currentConfig = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    console.log('Current assistant:', currentConfig.data.name);
    console.log('Current tools:', currentConfig.data.toolIds?.length || 0, 'tools attached');
    console.log('Current model:', currentConfig.data.model?.provider, currentConfig.data.model?.model, '\n');

    console.log('📤 Updating Sarah with new instructions...\n');

    // Preserve existing model config, only update system message
    const updatePayload = {
      model: {
        ...currentConfig.data.model,
        messages: [
          {
            role: 'system',
            content: newSystemPrompt
          }
        ]
      }
    };

    const response = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${SARAH_ASSISTANT_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Sarah updated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SOLUTION IMPLEMENTED!\n');
    console.log('Sarah will now:');
    console.log('  1. ✅ Collect all qualification data');
    console.log('  2. ✅ Call capture_qualification_data() with all params');
    console.log('  3. ✅ Call send_info_case_boost() with EXPLICIT params');
    console.log('  4. ✅ Send unique values for each field to GHL\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🧪 NEXT STEPS:\n');
    console.log('1. Make a TEST CALL to Sarah');
    console.log('2. Answer her qualification questions with DIFFERENT values:');
    console.log('   - Firm name: "Test Firm"');
    console.log('   - Firm size: "5-10"');
    console.log('   - Staff count: "12"');
    console.log('   - Current leads: "8"');
    console.log('   - Capacity: "25"');
    console.log('   - Success: "Double our cases"');
    console.log('3. Check GHL webhook - you should see:');
    console.log('   ✅ firm_name: "Test Firm"');
    console.log('   ✅ firm_size: "5-10"');
    console.log('   ✅ staff_count: "12"');
    console.log('   ✅ ALL fields with correct unique values!\n');
    console.log('4. If all values are unique → Problem SOLVED! 🎉\n');

  } catch (error) {
    console.error('❌ Error updating Sarah:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the update
updateSarahPrompt();

