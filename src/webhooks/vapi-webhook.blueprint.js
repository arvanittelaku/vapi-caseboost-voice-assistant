require("dotenv").config();
const { DateTime } = require("luxon");
const ghlClient = require("../services/ghl-client.blueprint");
const callRetryService = require("../services/call-retry-service.blueprint");

const CALENDAR_ID = process.env.GHL_CALENDAR_ID;
const CALENDAR_TIMEZONE = process.env.CALENDAR_TIMEZONE || "America/New_York";

// Working hours: 9 AM - 5 PM, Monday-Friday
const WORKING_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM
  days: [1, 2, 3, 4, 5], // Mon-Fri
};

/**
 * Main webhook handler
 */
async function handleVAPIWebhook(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`[${timestamp}] VAPI Webhook Received`);
  console.log(`${"=".repeat(80)}`);

  try {
    const event = req.body;

    // Log the incoming event
    console.log("[WEBHOOK] Event type:", event.type || event.message?.type || "unknown");
    console.log("[WEBHOOK] Squad ID:", event.squadId || "N/A");
    console.log("[WEBHOOK] Assistant ID:", event.assistantId || "N/A");

    // Handle call-ended events (for retry logic)
    const eventType = event.type || event.message?.type;
    if (eventType === "call-ended" || eventType === "end-of-call-report") {
      console.log("[WEBHOOK] Call ended event detected");
      await handleCallEnded(event);
      return res.json({ success: true, message: "Call ended event processed" });
    }

    // Parse tool call (supports multiple formats)
    const toolCall =
      (event.message?.toolCalls && event.message.toolCalls[0]) ||
      event.message?.toolCall ||
      (event.toolCallList && event.toolCallList[0]) ||
      null;

    if (!toolCall) {
      console.log("[WEBHOOK] No tool call found in request");
      return res.json({ success: true, message: "No tool call to process" });
    }

    console.log("[WEBHOOK] Tool called:", toolCall.function?.name);
    console.log(
      "[WEBHOOK] Parameters:",
      JSON.stringify(toolCall.function?.arguments, null, 2)
    );

    // Route to appropriate handler (supports both naming conventions)
    let result;
    const functionName = toolCall.function?.name;

    if (functionName === "check_calendar_availability" || 
        functionName === "check_calendar_availability_caseboost") {
      result = await handleCheckCalendarAvailability(toolCall, event);
    } else if (functionName === "book_calendar_appointment" || 
               functionName === "book_calendar_appointment_caseboost") {
      result = await handleBookCalendarAppointment(toolCall, event);
    } else if (functionName === "capture_qualification_data") {
      // This tool just captures data - return success (data is used by send_info_case_boost)
      console.log("[WEBHOOK] Data captured successfully");
      result = { success: true, message: "Data captured successfully" };
    } else {
      console.log("[WEBHOOK] Unknown function:", functionName);
      result = { error: `Unknown function: ${functionName}` };
    }

    // Return response in VAPI format
    const response = {
      results: [
        {
          toolCallId: toolCall.id,
          result: result,
        },
      ],
    };

    console.log("[WEBHOOK] Response:", JSON.stringify(response, null, 2));
    console.log(`${"=".repeat(80)}\n`);

    return res.json(response);
  } catch (error) {
    console.error("[WEBHOOK] Error:", error.message);
    console.error("[WEBHOOK] Stack:", error.stack);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

/**
 * Tool 1: Check Calendar Availability
 */
async function handleCheckCalendarAvailability(toolCall, event) {
  try {
    const params = toolCall.function.arguments;
    // Support both parameter naming conventions
    const requestedDate = params.requestedDate || params.date;
    const requestedTime = params.requestedTime || params.time;
    const timezone = params.timezone;

    console.log(
      `[CHECK_AVAILABILITY] Checking: ${requestedDate} at ${requestedTime} (${timezone})`
    );

    // Parse requested date/time in user's timezone
    const userDateTime = parseUserDateTime(
      requestedDate,
      requestedTime,
      timezone
    );

    if (!userDateTime.isValid) {
      return {
        available: false,
        message: `I couldn't understand that date/time. Could you say it differently? For example: "Monday at 2 PM" or "November 5th at 10:30 AM"`,
      };
    }

    console.log(`[CHECK_AVAILABILITY] Parsed as: ${userDateTime.toISO()}`);

    // Convert to calendar timezone
    const calendarDateTime = userDateTime.setZone(CALENDAR_TIMEZONE);
    console.log(
      `[CHECK_AVAILABILITY] Calendar timezone: ${calendarDateTime.toISO()}`
    );

    // Check working hours
    const hour = calendarDateTime.hour;
    const dayOfWeek = calendarDateTime.weekday;

    if (!WORKING_HOURS.days.includes(dayOfWeek)) {
      return {
        available: false,
        message:
          "We're only available Monday through Friday. Would you like to schedule for a weekday?",
      };
    }

    if (hour < WORKING_HOURS.start || hour >= WORKING_HOURS.end) {
      return {
        available: false,
        message: `Our hours are ${WORKING_HOURS.start} AM to ${WORKING_HOURS.end} PM. Would you like a time within those hours?`,
      };
    }

    // Fetch free slots from GHL
    const dateStr = calendarDateTime.toISODate();
    const freeSlots = await ghlClient.checkCalendarAvailability(
      CALENDAR_ID,
      dateStr,
      CALENDAR_TIMEZONE
    );

    // Check if requested time is in the list of free slots (1-minute tolerance)
    const requestedStartMs = calendarDateTime.toMillis();
    let isAvailable = false;

    for (const slotStr of freeSlots) {
      // Parse the free slot time (format: "2025-11-04T09:00:00-05:00")
      const freeSlot = DateTime.fromISO(slotStr, { zone: CALENDAR_TIMEZONE });
      const diff = Math.abs(freeSlot.toMillis() - requestedStartMs);

      // CRITICAL: 1-minute tolerance (60000ms) for exact matching
      if (diff < 60000) {
        isAvailable = true;
        break;
      }
    }

    if (!isAvailable) {
      console.log(`[CHECK_AVAILABILITY] Slot is NOT AVAILABLE`);

      // Suggest alternatives from free slots
      const alternatives = freeSlots.slice(0, 3).map(slotStr => {
        const slot = DateTime.fromISO(slotStr, { zone: CALENDAR_TIMEZONE });
        return slot.setZone(timezone);
      });

      return {
        available: false,
        message: `That time isn't available. How about one of these instead?`,
        alternatives: alternatives.map((alt) => ({
          date: alt.toFormat("EEEE, MMMM d"),
          time: alt.toFormat("h:mm a"),
          timezone: timezone,
        })),
      };
    }

    console.log(`[CHECK_AVAILABILITY] Slot is AVAILABLE`);

    return {
      available: true,
      message: `Great! ${userDateTime.toFormat(
        "EEEE, MMMM d"
      )} at ${userDateTime.toFormat("h:mm a")} is available.`,
    };
  } catch (error) {
    console.error("[CHECK_AVAILABILITY] Error:", error.message);
    return {
      available: false,
      message:
        "I'm having trouble checking availability right now. Could you try again?",
    };
  }
}

/**
 * Tool 2: Book Calendar Appointment
 */
async function handleBookCalendarAppointment(toolCall, event) {
  try {
    const params = toolCall.function.arguments;
    // Support both parameter naming conventions
    const bookingDate = params.bookingDate || params.date;
    const bookingTime = params.bookingTime || params.time;
    const timezone = params.timezone;
    const fullName = params.fullName || params.name;
    const email = params.email;
    const phone = params.phone;

    console.log(`[BOOK_APPOINTMENT] Booking for: ${fullName} (${email})`);
    console.log(
      `[BOOK_APPOINTMENT] Time: ${bookingDate} at ${bookingTime} (${timezone})`
    );

    // Parse booking time using the same function as availability check
    const userDateTime = parseUserDateTime(bookingDate, bookingTime, timezone);

    if (!userDateTime.isValid) {
      console.log(`[BOOK_APPOINTMENT] Failed to parse date: ${bookingDate} ${bookingTime}`);
      return {
        success: false,
        message:
          "There was an error with the booking time. Let me check availability again.",
      };
    }

    console.log(`[BOOK_APPOINTMENT] Parsed as: ${userDateTime.toISO()}`);

    // Convert to calendar timezone
    const calendarDateTime = userDateTime.setZone(CALENDAR_TIMEZONE);
    const startTimeMs = calendarDateTime.toMillis();

    // Double-check availability in free slots (1-minute tolerance)
    const dateStr = calendarDateTime.toISODate();
    const freeSlots = await ghlClient.checkCalendarAvailability(
      CALENDAR_ID,
      dateStr,
      CALENDAR_TIMEZONE
    );

    // Check if requested time is in the list of free slots
    let isAvailable = false;
    for (const slotStr of freeSlots) {
      const freeSlot = DateTime.fromISO(slotStr, { zone: CALENDAR_TIMEZONE });
      const diff = Math.abs(freeSlot.toMillis() - startTimeMs);

      if (diff < 60000) {
        isAvailable = true;
        break;
      }
    }

    if (!isAvailable) {
      console.log(`[BOOK_APPOINTMENT] Slot no longer available!`);
      return {
        success: false,
        message:
          "I'm sorry, that time was just taken. Let me find you another option.",
      };
    }

    // Get contact ID from event
    const contactId = event.call?.customer?.id || event.customer?.id;

    if (!contactId) {
      console.error("[BOOK_APPOINTMENT] No contact ID in event");
      return {
        success: false,
        message: "I couldn't find your contact information. Please try again.",
      };
    }

    // Create appointment
    const appointment = await ghlClient.createCalendarAppointment(CALENDAR_ID, {
      contactId: contactId,
      startTime: startTimeMs,
      title: `Appointment - ${fullName}`,
    });

    console.log(`[BOOK_APPOINTMENT] Appointment created: ${appointment.id}`);

    // Update contact custom fields
    // Using correct GHL field keys: requested_meeting_date, requested_meeting_time, meeting_status
    await ghlClient.updateContactCustomFields(contactId, {
      requested_meeting_date: bookingDate,
      requested_meeting_time: bookingTime,
      meeting_timezone: timezone,
      meeting_status: "Confirmed",
    });

    console.log(`[BOOK_APPOINTMENT] Contact updated successfully`);

    return {
      success: true,
      message: `Perfect! Your appointment is confirmed for ${userDateTime.toFormat(
        "EEEE, MMMM d"
      )} at ${userDateTime.toFormat(
        "h:mm a"
      )} ${timezone}. You'll receive a confirmation email shortly.`,
      appointmentId: appointment.id,
    };
  } catch (error) {
    console.error("[BOOK_APPOINTMENT] Error:", error.message);
    return {
      success: false,
      message:
        "I encountered an error while booking. Please try again or contact support.",
    };
  }
}

/**
 * Helper: Parse user's date/time input
 */
function parseUserDateTime(dateStr, timeStr, timezone) {
  // Validate inputs
  if (!dateStr || !timeStr || !timezone) {
    console.error(`[PARSE_DATE] Missing required parameters: dateStr=${dateStr}, timeStr=${timeStr}, timezone=${timezone}`);
    return DateTime.invalid("Missing required parameters");
  }

  const now = DateTime.now().setZone(timezone);

  // Handle relative dates
  let targetDate = now;

  const dateLower = String(dateStr).toLowerCase();

  if (dateLower.includes("today")) {
    targetDate = now;
  } else if (dateLower.includes("tomorrow")) {
    targetDate = now.plus({ days: 1 });
  } else if (dateLower.includes("monday")) {
    targetDate = now.set({ weekday: 1 });
    if (targetDate < now) targetDate = targetDate.plus({ weeks: 1 });
  } else if (dateLower.includes("tuesday")) {
    targetDate = now.set({ weekday: 2 });
    if (targetDate < now) targetDate = targetDate.plus({ weeks: 1 });
  } else if (dateLower.includes("wednesday")) {
    targetDate = now.set({ weekday: 3 });
    if (targetDate < now) targetDate = targetDate.plus({ weeks: 1 });
  } else if (dateLower.includes("thursday")) {
    targetDate = now.set({ weekday: 4 });
    if (targetDate < now) targetDate = targetDate.plus({ weeks: 1 });
  } else if (dateLower.includes("friday")) {
    targetDate = now.set({ weekday: 5 });
    if (targetDate < now) targetDate = targetDate.plus({ weeks: 1 });
  }

  // Parse time
  const timeFormats = ["h:mm a", "h a", "ha", "HH:mm"];

  let parsedTime = null;
  for (const format of timeFormats) {
    parsedTime = DateTime.fromFormat(timeStr, format, { zone: timezone });
    if (parsedTime.isValid) break;
  }

  if (!parsedTime || !parsedTime.isValid) {
    return DateTime.invalid("Unable to parse time");
  }

  // Combine date and time
  return targetDate.set({
    hour: parsedTime.hour,
    minute: parsedTime.minute,
    second: 0,
    millisecond: 0,
  });
}

/**
 * Helper: Find alternative time slots
 */
function findAlternativeSlots(requestedTime, busySlots, count = 3) {
  const alternatives = [];
  let currentTime = requestedTime;

  // Try next 10 slots (30-minute intervals)
  for (let i = 0; i < 10 && alternatives.length < count; i++) {
    currentTime = currentTime.plus({ minutes: 30 });

    // Skip if outside working hours
    if (currentTime.hour >= WORKING_HOURS.end) {
      currentTime = currentTime
        .plus({ days: 1 })
        .set({ hour: WORKING_HOURS.start, minute: 0 });
    }

    // Skip weekends
    if (!WORKING_HOURS.days.includes(currentTime.weekday)) {
      currentTime = currentTime
        .set({ weekday: 1 })
        .plus({ weeks: 1 })
        .set({ hour: WORKING_HOURS.start, minute: 0 });
    }

    // Check if slot is free
    const isBusy = busySlots.some((slot) => {
      // Handle both ISO string and Unix timestamp formats
      let busyStart;
      if (typeof slot.startTime === 'number') {
        busyStart = DateTime.fromMillis(slot.startTime, { zone: CALENDAR_TIMEZONE });
      } else {
        busyStart = DateTime.fromISO(slot.startTime, { zone: CALENDAR_TIMEZONE });
      }
      return Math.abs(busyStart.toMillis() - currentTime.toMillis()) < 60000;
    });

    if (!isBusy) {
      alternatives.push(currentTime);
    }
  }

  return alternatives;
}

/**
 * Handle call ended event - process retry logic
 */
async function handleCallEnded(event) {
  try {
    // Handle both direct event and nested message structure
    const call = event.call || event.message?.call || event;
    const endedReason = call.endedReason || call.ended_reason;
    const duration = call.duration || 0;
    const transcript = call.transcript || "";

    console.log(`[CALL_ENDED] Reason: ${endedReason}`);
    console.log(`[CALL_ENDED] Duration: ${duration}s`);

    // Extract contact info from variableValues or assistantOverrides
    const variableValues = 
      call?.assistantOverrides?.variableValues || 
      call?.variableValues ||
      event?.assistantOverrides?.variableValues ||
      event?.message?.call?.assistantOverrides?.variableValues ||
      {};

    const contactId = variableValues.contact_id || variableValues.contactId;
    const phone = variableValues.phone || call?.customer?.number;

    if (!contactId) {
      console.log("⚠️ No contact ID found in call event");
      return;
    }

    console.log(`[CALL_ENDED] Contact ID: ${contactId}`);
    console.log(`[CALL_ENDED] Phone: ${phone}`);

      // CRITICAL: Retry reading from GHL until we get valid call_attempts data
      // GHL API has significant delay, so we need multiple retries with backoff
      console.log(`⏳ Waiting for GHL to sync data (retry with exponential backoff)...`);
      
      let contact;
      let attempts = 0;
      const maxAttempts = 5;
      const delays = [3000, 5000, 7000, 10000, 15000]; // Progressive delays in ms
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Read attempt ${attempts}/${maxAttempts} (waiting ${delays[attempts-1]/1000}s)...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempts-1]));
        
        contact = await ghlClient.getContact(contactId);
        const callAttemptsValue = contact.customFieldsParsed?.call_attempts;
        
        console.log(`📊 Read from GHL: call_attempts = ${callAttemptsValue || 'undefined'}`);
        
        // If we got valid data (not undefined and not "0"), break
        if (callAttemptsValue && callAttemptsValue !== "0") {
          console.log(`✅ Got valid call_attempts data: ${callAttemptsValue}`);
          break;
        }
        
        if (attempts === maxAttempts) {
          console.warn(`⚠️ Failed to get valid call_attempts after ${maxAttempts} attempts, using default`);
        }
      }
      
      const customerTimezone = contact.timezone || contact.customFieldsParsed?.customer_timezone || "America/New_York";

    // Update basic call info
    await ghlClient.updateContactCustomFields(contactId, {
      ended_reason: endedReason,
      call_duration: duration.toString(),
      last_call_time: new Date().toISOString(),
      call_transcript: transcript.substring(0, 5000), // Limit transcript length
    });

    // Check if call was successful
    const isSuccess = callRetryService.isCallSuccessful(endedReason, duration);

    if (isSuccess) {
      console.log(`✅ CALL SUCCESSFUL (${duration}s)`);
      await ghlClient.updateContactCustomFields(contactId, {
        call_status: "success",
        call_result: "answered",
      });
      return;
    }

    // Handle failed call
    console.log(`❌ CALL FAILED - Starting retry logic...`);
    await callRetryService.handleFailedCall(contactId, phone, endedReason, customerTimezone);
  } catch (error) {
    console.error("[CALL_ENDED] Error:", error.message);
    console.error("[CALL_ENDED] Stack:", error.stack);
    // Don't throw - we don't want call-ended errors to break the webhook
  }
}

module.exports = handleVAPIWebhook;

