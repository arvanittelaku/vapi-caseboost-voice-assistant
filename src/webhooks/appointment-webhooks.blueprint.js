require("dotenv").config();
const ghlClient = require("../services/ghl-client.blueprint");
const { DateTime } = require("luxon");

const CALENDAR_ID = "yipdEzKHohzoYmhg2Ctv";

/**
 * WEBHOOK 1: Update Appointment Confirmation Status
 * 
 * Called by VAPI when user confirms/wants to reschedule/wants to cancel
 * 
 * Expected payload from VAPI:
 * {
 *   status: "confirmed" | "rescheduled" | "canceled",
 *   contactId: "string",
 *   appointmentId: "string",
 *   notes: "string" (optional)
 * }
 */
async function handleUpdateAppointmentStatus(req, res) {
  try {
    console.log("\n================================================================================");
    console.log(`[${new Date().toISOString()}] Update Appointment Status Webhook Received`);
    console.log("================================================================================");

    // Handle both Vapi tool call format and direct format
    let status, contactId, appointmentId, notes;
    
    if (req.body.message?.toolCalls) {
      // Vapi tool call format
      const toolCall = req.body.message.toolCalls[0];
      console.log(`[APPT_UPDATE] Vapi tool call format detected`);
      console.log(`[APPT_UPDATE] Tool Call ID: ${toolCall.id}`);
      
      // Parse arguments (Vapi sends as string or object)
      let args = toolCall.function.arguments;
      if (typeof args === 'string') {
        console.log(`[APPT_UPDATE] Arguments is string, parsing JSON...`);
        args = JSON.parse(args);
      }
      
      status = args.status;
      contactId = args.contactId;
      appointmentId = args.appointmentId;
      notes = args.notes;
    } else {
      // Direct format (for testing)
      status = req.body.status;
      contactId = req.body.contactId;
      appointmentId = req.body.appointmentId;
      notes = req.body.notes;
      console.log(`[APPT_UPDATE] Direct format detected`);
    }

    console.log(`[APPT_UPDATE] Status: ${status}`);
    console.log(`[APPT_UPDATE] Contact ID: ${contactId}`);
    console.log(`[APPT_UPDATE] Appointment ID: ${appointmentId}`);
    console.log(`[APPT_UPDATE] Notes: ${notes || "N/A"}`);

    // Validate required fields
    if (!status || !contactId || !appointmentId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: status, contactId, appointmentId"
      });
    }

    // Check if this is a Vapi tool call (needs special response format)
    const isVapiToolCall = req.body.message?.toolCalls;
    const toolCallId = isVapiToolCall ? req.body.message.toolCalls[0].id : null;

    // Handle based on status
    let result;
    switch (status.toLowerCase()) {
      case "confirmed":
        // Update appointment status to confirmed
        await ghlClient.updateAppointmentStatus(appointmentId, "confirmed");
        
        // Update contact custom field
        await ghlClient.updateContactCustomFields(contactId, {
          confirmation_status: "confirmed"
        });

        console.log(`✅ Appointment ${appointmentId} confirmed`);
        result = {
          success: true,
          message: "Appointment confirmed successfully",
          status: "confirmed"
        };
        break;

      case "rescheduled":
        console.log(`🔄 User wants to reschedule - will prompt for new date/time`);
        
        // Update contact to indicate rescheduling in progress
        await ghlClient.updateContactCustomFields(contactId, {
          confirmation_status: "rescheduling"
        });

        result = {
          success: true,
          message: "Ready to reschedule - please check availability",
          status: "rescheduling",
          requiresNewDateTime: true
        };
        break;

      case "canceled":
        console.log(`❌ User wants to cancel appointment`);
        
        // Cancel the appointment in GHL
        await ghlClient.cancelAppointment(appointmentId);
        
        // Update contact status
        await ghlClient.updateContactCustomFields(contactId, {
          confirmation_status: "canceled",
          call_status: "appointment_canceled"
        });

        console.log(`✅ Appointment ${appointmentId} canceled`);
        result = {
          success: true,
          message: "Appointment canceled successfully",
          status: "canceled"
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Invalid status: ${status}. Must be 'confirmed', 'rescheduled', or 'canceled'`
        });
    }

    // Return in appropriate format
    if (isVapiToolCall) {
      // Vapi tool call response format
      return res.json({
        results: [{
          toolCallId: toolCallId,
          result: result
        }]
      });
    } else {
      // Direct response format
      return res.json(result);
    }

  } catch (error) {
    console.error("❌ Error updating appointment status:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * WEBHOOK 2: Check Calendar Availability
 * 
 * Called by VAPI when user wants to reschedule - checks available slots
 * 
 * Expected payload from VAPI:
 * {
 *   date: "2025-11-21" (YYYY-MM-DD format),
 *   timezone: "America/New_York" (optional, defaults to America/New_York)
 * }
 */
async function handleCheckAvailability(req, res) {
  try {
    console.log("\n================================================================================");
    console.log(`[${new Date().toISOString()}] Check Availability Webhook Received`);
    console.log("================================================================================");

    const { date, timezone = "America/New_York" } = req.body;

    console.log(`[AVAILABILITY] Date: ${date}`);
    console.log(`[AVAILABILITY] Timezone: ${timezone}`);
    console.log(`[AVAILABILITY] Calendar ID: ${CALENDAR_ID}`);

    // Validate required fields
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: date (format: YYYY-MM-DD)"
      });
    }

    // Check availability
    const freeSlots = await ghlClient.checkCalendarAvailability(
      CALENDAR_ID,
      date,
      timezone
    );

    console.log(`✅ Found ${freeSlots.length} available slots`);

    // Format slots for easy reading by AI
    const formattedSlots = freeSlots.map(slot => {
      const dt = DateTime.fromISO(slot, { zone: timezone });
      return {
        time: dt.toFormat("h:mm a"),
        iso: slot,
        date: dt.toFormat("MMMM d, yyyy")
      };
    });

    return res.json({
      success: true,
      date: date,
      timezone: timezone,
      availableSlots: formattedSlots,
      count: formattedSlots.length
    });

  } catch (error) {
    console.error("❌ Error checking availability:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * WEBHOOK 3: Book New Appointment (Reschedule Flow)
 * 
 * Called by VAPI after user selects a new time slot
 * Cancels old appointment and books new one
 * 
 * Expected payload from VAPI:
 * {
 *   oldAppointmentId: "string",
 *   contactId: "string",
 *   startTime: "2025-11-21T10:00:00-05:00" (ISO 8601 format),
 *   title: "string" (optional)
 * }
 */
async function handleBookNewAppointment(req, res) {
  try {
    console.log("\n================================================================================");
    console.log(`[${new Date().toISOString()}] Book New Appointment Webhook Received`);
    console.log("================================================================================");

    const { oldAppointmentId, contactId, startTime, title = "Appointment" } = req.body;

    console.log(`[BOOK_APPT] Old Appointment ID: ${oldAppointmentId}`);
    console.log(`[BOOK_APPT] Contact ID: ${contactId}`);
    console.log(`[BOOK_APPT] New Start Time: ${startTime}`);
    console.log(`[BOOK_APPT] Title: ${title}`);

    // Validate required fields
    if (!oldAppointmentId || !contactId || !startTime) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: oldAppointmentId, contactId, startTime"
      });
    }

    // STEP 1: Cancel old appointment
    console.log(`🗑️ Canceling old appointment ${oldAppointmentId}...`);
    await ghlClient.cancelAppointment(oldAppointmentId);
    console.log(`✅ Old appointment canceled`);

    // STEP 2: Book new appointment
    console.log(`📅 Booking new appointment...`);
    
    // Convert ISO string to milliseconds for the API
    const startTimeMs = new Date(startTime).getTime();
    
    const newAppointment = await ghlClient.createCalendarAppointment(CALENDAR_ID, {
      contactId: contactId,
      startTime: startTimeMs,
      title: title,
      assignedUserId: "kt90MkHgpfkzwHXA4E5m" // Required: User who manages the appointment
    });

    console.log(`✅ New appointment booked: ${newAppointment.id}`);

    // STEP 3: Update contact custom fields
    const dt = DateTime.fromISO(startTime);
    await ghlClient.updateContactCustomFields(contactId, {
      appointment_date: dt.toFormat("MMMM d, yyyy"),
      appointment_time: dt.toFormat("h:mm a"),
      confirmation_status: "rescheduled",
      call_status: "appointment_rescheduled"
    });

    console.log(`✅ Contact updated with new appointment details`);

    return res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      oldAppointmentId: oldAppointmentId,
      newAppointmentId: newAppointment.id,
      newStartTime: startTime
    });

  } catch (error) {
    console.error("❌ Error booking new appointment:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  handleUpdateAppointmentStatus,
  handleCheckAvailability,
  handleBookNewAppointment
};

