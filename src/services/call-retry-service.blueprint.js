require("dotenv").config();
const { DateTime } = require("luxon");
const ghlClient = require("./ghl-client.blueprint");

/**
 * Call Retry Service
 * 
 * Handles smart retry logic for failed calls:
 * - Timezone detection from phone numbers
 * - Calling hours validation (9 AM - 7 PM, Mon-Fri)
 * - Smart retry scheduling based on failure reason
 * - Follow-up actions (SMS, tags, emails)
 */
class CallRetryService {
  constructor() {
    this.bookingLink = process.env.BOOKING_LINK || "https://caseboost.com/book";
  }

  /**
   * Detect timezone from phone number
   */
  detectTimezoneFromPhone(phoneNumber) {
    if (!phoneNumber) return "America/New_York";

    const cleaned = phoneNumber.replace(/\D/g, "");

    // US/Canada
    if (cleaned.startsWith("1")) return "America/New_York";

    // Europe
    if (cleaned.startsWith("44")) return "Europe/London";
    if (cleaned.startsWith("49")) return "Europe/Berlin";
    if (cleaned.startsWith("33")) return "Europe/Paris";
    if (cleaned.startsWith("34")) return "Europe/Madrid";
    if (cleaned.startsWith("39")) return "Europe/Rome";
    if (cleaned.startsWith("383")) return "Europe/Belgrade"; // Kosovo

    // Default
    return "America/New_York";
  }

  /**
   * Check if current time is within calling hours (9 AM - 7 PM, Mon-Fri)
   */
  isWithinCallingHours(timezone) {
    try {
      const now = DateTime.now().setZone(timezone);
      const hour = now.hour;
      const dayOfWeek = now.weekday; // 1=Monday, 7=Sunday

      // Check weekend
      if (dayOfWeek === 6 || dayOfWeek === 7) {
        return {
          canCall: false,
          reason: "weekend",
          nextCallTime: this.getNextBusinessDay(now, timezone),
        };
      }

      // Too early (before 9 AM)
      if (hour < 9) {
        return {
          canCall: false,
          reason: "too_early",
          nextCallTime: now.set({ hour: 10, minute: 0, second: 0, millisecond: 0 }).toISO(),
        };
      }

      // Too late (after 7 PM)
      if (hour >= 19) {
        const nextDay = now.plus({ days: 1 }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
        return {
          canCall: false,
          reason: "too_late",
          nextCallTime: this.getNextBusinessDay(nextDay, timezone),
        };
      }

      return { canCall: true, reason: "ok" };
    } catch (error) {
      console.error("❌ Error checking calling hours:", error);
      return { canCall: false, reason: "error", nextCallTime: null };
    }
  }

  /**
   * Get next business day at 10 AM
   */
  getNextBusinessDay(currentDateTime, timezone) {
    let next = currentDateTime.setZone(timezone);
    while (next.weekday === 6 || next.weekday === 7) {
      next = next.plus({ days: 1 });
    }
    return next.set({ hour: 10, minute: 0, second: 0, millisecond: 0 }).toISO();
  }

  /**
   * Calculate smart retry time based on attempt number and failure reason
   */
  calculateSmartRetryTime(attemptNumber, endedReason, customerTimezone) {
    let delayMinutes;

    // Determine delay based on reason
    switch (endedReason) {
      case "customer-busy":
      case "user-busy":
        delayMinutes = 25; // 25 minutes
        break;

      case "customer-did-not-answer":
      case "no-answer-from-user":
        delayMinutes = 120; // 2 hours
        break;

      case "voicemail":
      case "voicemail-reached":
        delayMinutes = 240; // 4 hours
        break;

      default:
        delayMinutes = 120; // 2 hours default
    }

    // Calculate next call time
    const now = DateTime.now().setZone(customerTimezone);
    let nextCallTime = now.plus({ minutes: delayMinutes });

    // Adjust to business hours
    const hour = nextCallTime.hour;
    const dayOfWeek = nextCallTime.weekday;

    // If after 7 PM, schedule for 10 AM next day
    if (hour >= 19) {
      nextCallTime = nextCallTime.plus({ days: 1 }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    }

    // If before 9 AM, schedule for 10 AM same day
    if (hour < 9) {
      nextCallTime = nextCallTime.set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
    }

    // Skip weekends
    while (nextCallTime.weekday === 6 || nextCallTime.weekday === 7) {
      nextCallTime = nextCallTime.plus({ days: 1 });
    }

    return nextCallTime.toISO();
  }

  /**
   * Determine call result from ended reason
   */
  getCallResult(endedReason) {
    switch (endedReason) {
      case "customer-busy":
      case "user-busy":
        return "busy";
      case "customer-did-not-answer":
      case "no-answer-from-user":
        return "no_answer";
      case "voicemail":
      case "voicemail-reached":
        return "voicemail";
      case "assistant-ended-call":
      case "customer-ended-call":
        return "answered";
      default:
        return "failed";
    }
  }

  /**
   * Check if call was successful
   */
  isCallSuccessful(endedReason, duration) {
    const successReasons = ["assistant-ended-call", "customer-ended-call"];
    return successReasons.includes(endedReason) && duration > 30;
  }

  /**
   * Handle failed call - update GHL and schedule retry
   */
  async handleFailedCall(contactId, phone, endedReason, customerTimezone) {
    try {
      // 1. Get current attempt count (DO NOT increment - it was already incremented when call started)
      const contact = await ghlClient.getContact(contactId);
      const currentAttempts = parseInt(contact.customFieldsParsed?.call_attempts || "1");

      console.log(`📊 Call attempt #${currentAttempts} failed for contact ${contactId}`);

      // 2. Calculate next retry time
      const nextCallTime = this.calculateSmartRetryTime(
        currentAttempts,
        endedReason,
        customerTimezone
      );

      // 3. Determine call result
      const callResult = this.getCallResult(endedReason);

      // 4. Update GHL (keep same attempt number, just update status and schedule)
      await ghlClient.updateContactCustomFields(contactId, {
        call_result: callResult,
        ended_reason: endedReason,
        last_call_time: new Date().toISOString(),
        next_call_scheduled: nextCallTime,
        call_status: "retry_scheduled",
      });

      console.log(`✅ Updated contact ${contactId}: attempt #${currentAttempts} failed, next call at ${nextCallTime}`);

      // 5. Trigger follow-up actions
      await this.triggerFollowUpActions(contactId, phone, currentAttempts, endedReason);

      return {
        success: true,
        attemptNumber: currentAttempts,
        nextCallTime: nextCallTime,
      };
    } catch (error) {
      console.error("❌ Error in handleFailedCall:", error);
      throw error;
    }
  }

  /**
   * Trigger follow-up actions based on attempt number
   */
  async triggerFollowUpActions(contactId, phone, attemptNumber, endedReason) {
    // Attempt #2: Send SMS
    if (attemptNumber === 2) {
      console.log(`📱 Attempt #2 failed - sending SMS`);
      await this.sendFollowUpSMS(contactId, phone);
    }

    // Attempt #3: Email + Tag
    if (attemptNumber >= 3) {
      console.log(`🏷️ Attempt #${attemptNumber} failed - adding manual follow-up tag`);

      await ghlClient.updateContactCustomFields(contactId, {
        call_status: "needs_manual_followup",
      });

      await ghlClient.addTagToContact(contactId, "Needs Manual Follow-Up");
      console.log(`✅ Tag added - email workflow should trigger`);
    }

    // Voicemail on first attempt: Send immediate SMS
    if (attemptNumber === 1 && (endedReason === "voicemail" || endedReason === "voicemail-reached")) {
      console.log(`📱 Voicemail on first attempt - sending immediate SMS`);
      await this.sendFollowUpSMS(contactId, phone);
    }
  }

  /**
   * Send follow-up SMS via GHL
   */
  async sendFollowUpSMS(contactId, phone) {
    try {
      const contact = await ghlClient.getContact(contactId);
      const firstName = contact.firstName || contact.first_name || "there";
      const bookingLink = this.bookingLink;

      const message = `Hi ${firstName}! We tried calling about your project. Book your free consultation: ${bookingLink} - CaseBoost Team`;

      console.log(`📱 Sending SMS to ${phone}: ${message.substring(0, 50)}...`);

      // Send SMS via GHL
      await ghlClient.sendSMS(contactId, phone, message);

      // Mark SMS as sent in GHL
      await ghlClient.updateContactCustomFields(contactId, {
        sms_sent: "yes",
        sms_sent_at: new Date().toISOString(),
      });

      console.log(`✅ SMS sent and marked in GHL`);
    } catch (error) {
      console.error("❌ Error sending SMS:", error);
      // Don't throw - SMS failure shouldn't break the flow
    }
  }
}

module.exports = new CallRetryService();

