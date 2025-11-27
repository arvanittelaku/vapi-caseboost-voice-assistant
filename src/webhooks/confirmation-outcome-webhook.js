/**
 * Confirmation Outcome Webhook Handler
 * 
 * This webhook receives confirmation call outcomes from VAPI
 * and triggers the appropriate SMS workflow in GHL
 * 
 * Endpoint: POST /webhook/confirmation-outcome
 * 
 * Expected payload from VAPI:
 * {
 *   "outcome": "confirmed" | "rescheduled" | "cancelled" | "no_answer",
 *   "contactId": "GHL contact ID",
 *   "firstName": "Customer first name",
 *   "appointmentTime": "Original appointment time (for no_answer)",
 *   "newAppointmentTime": "New time (for rescheduled)"
 * }
 */

const confirmationSMSHandler = require("./confirmation-sms-handler");

async function handleConfirmationOutcome(req, res) {
  try {
    const { outcome, contactId, firstName, appointmentTime, newAppointmentTime } = req.body;

    console.log("\n" + "=".repeat(80));
    console.log("📱 CONFIRMATION OUTCOME RECEIVED");
    console.log("=".repeat(80));
    console.log("Outcome:", outcome);
    console.log("Contact ID:", contactId);
    console.log("First Name:", firstName);
    if (appointmentTime) console.log("Appointment Time:", appointmentTime);
    if (newAppointmentTime) console.log("New Appointment Time:", newAppointmentTime);
    console.log("=".repeat(80));

    // Validate required fields
    if (!outcome) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: outcome",
      });
    }

    if (!contactId || !firstName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: contactId and firstName",
      });
    }

    // Handle the confirmation outcome
    const result = await confirmationSMSHandler.handleConfirmationOutcome(outcome, {
      contactId,
      firstName,
      appointmentTime,
      newAppointmentTime,
    });

    if (result.success) {
      console.log("✅ Confirmation SMS sent successfully");
      return res.json({
        success: true,
        message: `${outcome} SMS sent successfully`,
        outcome: outcome,
      });
    } else {
      console.error("❌ Failed to send confirmation SMS:", result.error);
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Error in handleConfirmationOutcome:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = { handleConfirmationOutcome };

