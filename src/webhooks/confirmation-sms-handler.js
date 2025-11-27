require("dotenv").config();
const axios = require("axios");

/**
 * Confirmation SMS Handler
 * 
 * Triggers appropriate GHL SMS workflow based on confirmation call outcome
 * 
 * Supported outcomes:
 * - confirmed: Customer confirmed the appointment
 * - rescheduled: Customer wants to reschedule
 * - cancelled: Customer wants to cancel
 * - no_answer: Customer didn't answer the confirmation call
 */

class ConfirmationSMSHandler {
  constructor() {
    this.webhooks = {
      confirmed: process.env.GHL_WEBHOOK_CONFIRMATION_CONFIRMED,
      rescheduled: process.env.GHL_WEBHOOK_CONFIRMATION_RESCHEDULED,
      cancelled: process.env.GHL_WEBHOOK_CONFIRMATION_CANCELLED,
      no_answer: process.env.GHL_WEBHOOK_CONFIRMATION_NO_ANSWER,
    };

    this.companyPhone = process.env.COMPANY_PHONE || "0203 967 3687";
  }

  /**
   * Send confirmation SMS via GHL webhook
   */
  async sendConfirmedSMS(contactId, firstName) {
    try {
      if (!this.webhooks.confirmed) {
        console.warn("⚠️ GHL_WEBHOOK_CONFIRMATION_CONFIRMED not configured");
        return { success: false, error: "Webhook not configured" };
      }

      console.log(`✅ Sending confirmation SMS to ${firstName} (${contactId})`);

      const payload = {
        contactId: contactId,
        firstName: firstName,
      };

      const response = await axios.post(this.webhooks.confirmed, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log(`✅ Confirmation SMS workflow triggered successfully`);
      return { success: true, response: response.data };
    } catch (error) {
      console.error("❌ Error sending confirmation SMS:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reschedule SMS via GHL webhook
   */
  async sendRescheduledSMS(contactId, firstName, newAppointmentTime) {
    try {
      if (!this.webhooks.rescheduled) {
        console.warn("⚠️ GHL_WEBHOOK_CONFIRMATION_RESCHEDULED not configured");
        return { success: false, error: "Webhook not configured" };
      }

      console.log(`🔄 Sending reschedule SMS to ${firstName} (${contactId})`);
      console.log(`   New time: ${newAppointmentTime}`);

      const payload = {
        contactId: contactId,
        firstName: firstName,
        custom_values: {
          newAppointmentTime: newAppointmentTime,
        },
      };

      const response = await axios.post(this.webhooks.rescheduled, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log(`✅ Reschedule SMS workflow triggered successfully`);
      return { success: true, response: response.data };
    } catch (error) {
      console.error("❌ Error sending reschedule SMS:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send cancellation SMS via GHL webhook
   */
  async sendCancelledSMS(contactId, firstName) {
    try {
      if (!this.webhooks.cancelled) {
        console.warn("⚠️ GHL_WEBHOOK_CONFIRMATION_CANCELLED not configured");
        return { success: false, error: "Webhook not configured" };
      }

      console.log(`❌ Sending cancellation SMS to ${firstName} (${contactId})`);

      const payload = {
        contactId: contactId,
        firstName: firstName,
      };

      const response = await axios.post(this.webhooks.cancelled, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log(`✅ Cancellation SMS workflow triggered successfully`);
      return { success: true, response: response.data };
    } catch (error) {
      console.error("❌ Error sending cancellation SMS:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send no-answer follow-up SMS via GHL webhook
   */
  async sendNoAnswerSMS(contactId, firstName, appointmentTime) {
    try {
      if (!this.webhooks.no_answer) {
        console.warn("⚠️ GHL_WEBHOOK_CONFIRMATION_NO_ANSWER not configured");
        return { success: false, error: "Webhook not configured" };
      }

      console.log(`📞 Sending no-answer SMS to ${firstName} (${contactId})`);
      console.log(`   Original appointment: ${appointmentTime}`);

      const payload = {
        contactId: contactId,
        firstName: firstName,
        custom_values: {
          appointmentTime: appointmentTime,
        },
      };

      const response = await axios.post(this.webhooks.no_answer, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log(`✅ No-answer SMS workflow triggered successfully`);
      return { success: true, response: response.data };
    } catch (error) {
      console.error("❌ Error sending no-answer SMS:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle confirmation call outcome and send appropriate SMS
   * 
   * @param {string} outcome - "confirmed", "rescheduled", "cancelled", or "no_answer"
   * @param {object} data - { contactId, firstName, newAppointmentTime?, appointmentTime? }
   */
  async handleConfirmationOutcome(outcome, data) {
    const { contactId, firstName, newAppointmentTime, appointmentTime } = data;

    console.log(`\n📱 Handling confirmation outcome: ${outcome}`);
    console.log(`   Contact: ${firstName} (${contactId})`);

    switch (outcome) {
      case "confirmed":
        return await this.sendConfirmedSMS(contactId, firstName);

      case "rescheduled":
        if (!newAppointmentTime) {
          console.error("❌ newAppointmentTime required for rescheduled outcome");
          return { success: false, error: "Missing newAppointmentTime" };
        }
        return await this.sendRescheduledSMS(contactId, firstName, newAppointmentTime);

      case "cancelled":
        return await this.sendCancelledSMS(contactId, firstName);

      case "no_answer":
        if (!appointmentTime) {
          console.error("❌ appointmentTime required for no_answer outcome");
          return { success: false, error: "Missing appointmentTime" };
        }
        return await this.sendNoAnswerSMS(contactId, firstName, appointmentTime);

      default:
        console.error(`❌ Unknown outcome: ${outcome}`);
        return { success: false, error: "Unknown outcome" };
    }
  }

  /**
   * Verify all webhooks are configured
   */
  verifyConfiguration() {
    const missing = [];
    
    if (!this.webhooks.confirmed) missing.push("GHL_WEBHOOK_CONFIRMATION_CONFIRMED");
    if (!this.webhooks.rescheduled) missing.push("GHL_WEBHOOK_CONFIRMATION_RESCHEDULED");
    if (!this.webhooks.cancelled) missing.push("GHL_WEBHOOK_CONFIRMATION_CANCELLED");
    if (!this.webhooks.no_answer) missing.push("GHL_WEBHOOK_CONFIRMATION_NO_ANSWER");

    if (missing.length > 0) {
      console.warn("⚠️ Missing confirmation SMS webhook configuration:");
      missing.forEach(key => console.warn(`   - ${key}`));
      return false;
    }

    console.log("✅ All confirmation SMS webhooks configured");
    return true;
  }
}

// Export singleton instance
module.exports = new ConfirmationSMSHandler();

