require("dotenv").config();
const { DateTime } = require("luxon");
const ghlClient = require("../services/ghl-client.blueprint");
const vapiClient = require("../services/vapi-client.blueprint");
const callRetryService = require("../services/call-retry-service.blueprint");

const SQUAD_ID = process.env.VAPI_SQUAD_ID || "d84cc64f-e67b-4020-8204-8a1cfdacdf16";
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || "bd9e0ff5-c3af-4b39-a2f3-21b7debcb434";

/**
 * Handle GHL workflow webhook for retry calls
 * 
 * This endpoint is called by GHL workflow when next_call_scheduled time arrives
 */
async function handleGHLRetryWebhook(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`[${timestamp}] GHL Retry Webhook Received`);
  console.log(`${"=".repeat(80)}`);

  try {
    const { contactId, customer, assistantOverrides } = req.body;

    // Extract contact ID from various possible sources
    const contactIdFromBody = 
      contactId || 
      assistantOverrides?.variableValues?.contact_id ||
      assistantOverrides?.variableValues?.contactId ||
      customer?.id;

    if (!contactIdFromBody) {
      console.error("[RETRY] No contact ID found in request");
      return res.status(400).json({ 
        success: false, 
        error: "Contact ID is required" 
      });
    }

    console.log(`[RETRY] Contact ID: ${contactIdFromBody}`);

    // Get contact from GHL
    const contact = await ghlClient.getContact(contactIdFromBody);
    const phone = customer?.number || contact.phone || contact.phoneNumber;
    const customerName = customer?.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

    if (!phone) {
      console.error("[RETRY] No phone number found");
      return res.status(400).json({ 
        success: false, 
        error: "Phone number is required" 
      });
    }

    console.log(`[RETRY] Phone: ${phone}`);
    console.log(`[RETRY] Name: ${customerName}`);

    // Detect timezone
    const detectedTimezone = callRetryService.detectTimezoneFromPhone(phone);
    console.log(`🌍 Detected timezone: ${detectedTimezone}`);

    // Save timezone to GHL if not already set
    if (!contact.timezone) {
      await ghlClient.updateContactCustomFields(contactIdFromBody, {
        timezone: detectedTimezone,
      });
    }

    // Check calling hours (can be bypassed for testing with ?testMode=true)
    const testMode = req.query.testMode === 'true';
    const callingHoursCheck = callRetryService.isWithinCallingHours(detectedTimezone);

    if (!testMode && !callingHoursCheck.canCall) {
      console.log(`⏰ OUTSIDE CALLING HOURS - Reason: ${callingHoursCheck.reason}`);
      console.log(`⏰ Scheduling for: ${callingHoursCheck.nextCallTime}`);

      // Reschedule for later
      await ghlClient.updateContactCustomFields(contactIdFromBody, {
        call_status: "retry_scheduled",
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
      console.log(`🧪 TEST MODE ENABLED - Bypassing calling hours check`);
    }

    // CRITICAL FIX: Check if scheduled time has arrived
    const scheduledTimeStr = contact.customFieldsParsed?.next_call_scheduled;
    
    if (scheduledTimeStr) {
      const scheduledTime = DateTime.fromISO(scheduledTimeStr, { zone: detectedTimezone });
      const now = DateTime.now().setZone(detectedTimezone);

      if (scheduledTime.isValid && scheduledTime > now) {
        const minutesUntil = Math.round(scheduledTime.diff(now, 'minutes').minutes);
        console.log(`⏰ SCHEDULED TIME NOT YET REACHED`);
        console.log(`   Scheduled for: ${scheduledTime.toISO()}`);
        console.log(`   Current time: ${now.toISO()}`);
        console.log(`   Wait ${minutesUntil} more minutes`);
        
        return res.json({
          success: true,
          message: "Scheduled time not yet reached",
          scheduledTime: scheduledTime.toISO(),
          minutesUntil: minutesUntil
        });
      }
    }

    console.log(`✅ SCHEDULED TIME HAS ARRIVED - Proceeding with call`);

    // Get current attempt count
    const currentAttempts = parseInt(contact.customFieldsParsed?.call_attempts || "0");
    const newAttempts = currentAttempts + 1;

    console.log(`📞 Making retry call attempt #${newAttempts}`);

    // Update status to "calling_now"
    await ghlClient.updateContactCustomFields(contactIdFromBody, {
      call_status: "calling_now",
      call_attempts: newAttempts.toString(),
      last_call_time: new Date().toISOString(),
    });

    // Prepare VAPI call payload
    const vapiPayload = {
      squadId: SQUAD_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: phone,
        name: customerName,
        email: contact.email || customer?.email,
      },
      assistantOverrides: {
        variableValues: {
          contact_id: contactIdFromBody,
          firstName: contact.firstName || contact.first_name || "",
          lastName: contact.lastName || contact.last_name || "",
          email: contact.email || "",
          phone: phone,
          fullName: customerName,
          ...assistantOverrides?.variableValues,
        },
        firstMessage: `Hi ${contact.firstName || contact.first_name || "there"}, this is Sarah from CaseBoost. We're calling you back as promised. Do you have a few minutes to discuss how we can help grow your practice?`,
      },
    };

    // Make the call via VAPI
    const callResponse = await vapiClient.createCall(vapiPayload);

    console.log(`✅ Call initiated successfully`);
    console.log(`   Call ID: ${callResponse.id}`);

    return res.json({ 
      success: true, 
      callId: callResponse.id,
      attemptNumber: newAttempts,
    });
  } catch (error) {
    console.error("[RETRY] Error:", error.message);
    console.error("[RETRY] Stack:", error.stack);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
}

module.exports = handleGHLRetryWebhook;

