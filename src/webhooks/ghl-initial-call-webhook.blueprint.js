require("dotenv").config();
const ghlClient = require("../services/ghl-client.blueprint");
const vapiClient = require("../services/vapi-client.blueprint");
const callRetryService = require("../services/call-retry-service.blueprint");

const SQUAD_ID = process.env.VAPI_SQUAD_ID || "d84cc64f-e67b-4020-8204-8a1cfdacdf16";
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || "bd9e0ff5-c3af-4b39-a2f3-21b7debcb434";

/**
 * Initial Call Handler (GHL → VAPI)
 * 
 * This endpoint is called by GHL workflow when a contact is first created.
 * It handles:
 * 1. Timezone detection from phone number
 * 2. Calling hours validation (9 AM - 7 PM, Mon-Fri)
 * 3. Making the initial call OR scheduling for later
 * 
 * This matches the structure from your example project.
 */
async function handleInitialCall(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`[${timestamp}] GHL Initial Call Webhook Received`);
  console.log(`${"=".repeat(80)}`);

  try {
    const { customer, assistantOverrides } = req.body;
    const phone = customer?.number;
    const contactId = assistantOverrides?.variableValues?.contact_id || 
                      assistantOverrides?.variableValues?.contactId ||
                      req.body.contactId;

    console.log(`[INITIAL_CALL] Contact ID: ${contactId}`);
    console.log(`[INITIAL_CALL] Phone: ${phone}`);

    if (!contactId) {
      console.error("[INITIAL_CALL] No contact ID found in request");
      return res.status(400).json({ 
        success: false, 
        error: "Contact ID is required" 
      });
    }

    if (!phone) {
      console.error("[INITIAL_CALL] No phone number found");
      return res.status(400).json({ 
        success: false, 
        error: "Phone number is required" 
      });
    }

    // 1. Detect timezone from phone number
    const detectedTimezone = callRetryService.detectTimezoneFromPhone(phone);
    console.log(`🌍 [INITIAL_CALL] Detected timezone: ${detectedTimezone}`);

    // 2. Save timezone to GHL (using built-in timezone field or custom field)
    try {
      // Try to update timezone field (GHL built-in)
      await ghlClient.updateContactCustomFields(contactId, {
        timezone: detectedTimezone,
      });
      console.log(`✅ [INITIAL_CALL] Timezone saved to GHL`);
    } catch (error) {
      console.log(`⚠️ [INITIAL_CALL] Could not save timezone (non-critical): ${error.message}`);
    }

    // 3. Check calling hours (can be bypassed for testing with ?testMode=true)
    const testMode = req.query.testMode === 'true';
    const callingHoursCheck = callRetryService.isWithinCallingHours(detectedTimezone);

    if (!testMode && !callingHoursCheck.canCall) {
      console.log(`⏰ [INITIAL_CALL] OUTSIDE CALLING HOURS - Reason: ${callingHoursCheck.reason}`);
      console.log(`⏰ [INITIAL_CALL] Scheduling for: ${callingHoursCheck.nextCallTime}`);

      // Schedule for later
      await ghlClient.updateContactCustomFields(contactId, {
        call_status: "retry_scheduled",
        call_attempts: "0",
        next_call_scheduled: callingHoursCheck.nextCallTime,
        last_call_time: new Date().toISOString(),
      });

      return res.json({ 
        success: true, 
        message: "Call scheduled for business hours",
        nextCallTime: callingHoursCheck.nextCallTime,
      });
    }

    if (testMode) {
      console.log(`🧪 [INITIAL_CALL] TEST MODE ENABLED - Bypassing calling hours check`);
    }

    // 4. Make the call
    console.log(`📞 [INITIAL_CALL] Making initial call...`);

    // Get contact details for personalization
    let contact;
    try {
      contact = await ghlClient.getContact(contactId);
    } catch (error) {
      console.log(`⚠️ [INITIAL_CALL] Could not fetch contact details, using provided data`);
      contact = {};
    }

    const customerName = customer?.name || 
                        `${contact.firstName || contact.first_name || ""} ${contact.lastName || contact.last_name || ""}`.trim() ||
                        "Valued Customer";

    // Prepare VAPI call payload (matching your GHL workflow payload structure)
    const callPayload = {
      squadId: SQUAD_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: phone,
        name: customerName,
        email: customer?.email || contact.email,
      },
      assistantOverrides: {
        variableValues: {
          contact_id: contactId,
          firstName: assistantOverrides?.variableValues?.firstName || contact.firstName || contact.first_name || "",
          lastName: assistantOverrides?.variableValues?.lastName || contact.lastName || contact.last_name || "",
          email: assistantOverrides?.variableValues?.email || customer?.email || contact.email || "",
          phone: phone,
          fullName: customerName,
          // Include all other variables from assistantOverrides
          ...assistantOverrides?.variableValues,
        },
        firstMessage: assistantOverrides?.firstMessage || 
                     `Hi ${contact.firstName || contact.first_name || "there"}, this is Sarah from CaseBoost. Thanks for reaching out. Do you have a few minutes to discuss how we can help grow your practice?`,
      },
    };

    console.log(`📤 [INITIAL_CALL] VAPI Payload prepared`);
    console.log(`   Squad ID: ${SQUAD_ID}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Contact ID: ${contactId}`);

    // Make the call via VAPI
    const callResponse = await vapiClient.createCall(callPayload);

    console.log(`✅ [INITIAL_CALL] Call initiated successfully`);
    console.log(`   Call ID: ${callResponse.id}`);

    // 5. Update GHL
    await ghlClient.updateContactCustomFields(contactId, {
      call_status: "calling_now",
      call_attempts: "1",
      last_call_time: new Date().toISOString(),
    });

    return res.json({ 
      success: true, 
      callId: callResponse.id,
      message: "Initial call initiated",
    });
  } catch (error) {
    console.error("[INITIAL_CALL] Error:", error.message);
    console.error("[INITIAL_CALL] Stack:", error.stack);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
}

module.exports = handleInitialCall;

