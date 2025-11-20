require("dotenv").config();
const { DateTime } = require("luxon");

class GHLClient {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.baseUrl = "https://services.leadconnectorhq.com";
  }

  /**
   * Check calendar availability for a specific date/time
   * CRITICAL: GHL API requires Unix timestamps (milliseconds) for startTime/endTime
   */
  async checkCalendarAvailability(
    calendarId,
    dateStr,
    timezone = "America/New_York"
  ) {
    try {
      console.log(`📞 [GHL] Checking calendar availability...`);
      console.log(`   Calendar ID: ${calendarId}`);
      console.log(`   Date: ${dateStr}`);
      console.log(`   Timezone: ${timezone}`);

      // Convert date string to Unix timestamps (milliseconds)
      const startOfDay = DateTime.fromISO(dateStr, { zone: timezone }).startOf('day');
      const endOfDay = startOfDay.endOf('day');
      
      const startDate = startOfDay.toMillis();
      const endDate = endOfDay.toMillis();

      console.log(`   Start Timestamp: ${startDate} (${startOfDay.toISO()})`);
      console.log(`   End Timestamp: ${endDate} (${endOfDay.toISO()})`);

      // Use the free-slots API to get available slots
      const url = `${this.baseUrl}/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(timezone)}`;

      console.log(`   API URL: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [GHL] API Error (${response.status}):`, errorText);
        
        // Provide helpful error messages
        if (response.status === 403) {
          console.error(`
🔐 PERMISSION ERROR (403):
   Your API key does not have access to this calendar's location.
   
   TO FIX:
   1. Go to GHL Private Integrations
   2. Make sure the integration has calendar scopes enabled
   3. Regenerate the access token if needed
          `);
        }
        
        throw new Error(`GHL API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Extract free slots from the response
      // Response format: { "2025-11-04": { "slots": ["2025-11-04T09:00:00-05:00", ...] } }
      const freeSlots = [];
      for (const date in data) {
        if (date !== 'traceId' && data[date].slots) {
          freeSlots.push(...data[date].slots);
        }
      }
      
      console.log(`✅ [GHL] Calendar availability check successful`);
      console.log(`   Retrieved ${freeSlots.length} available slots`);

      return freeSlots;
    } catch (error) {
      console.error("❌ [GHL] Error checking availability:", error.message);
      throw error;
    }
  }

  /**
   * Create a calendar appointment
   * CRITICAL: GHL API requires ISO 8601 string for startTime
   */
  async createCalendarAppointment(calendarId, appointmentData) {
    try {
      console.log(`📅 [GHL] Creating appointment...`);
      console.log(`   Calendar ID: ${calendarId}`);
      console.log(`   Contact ID: ${appointmentData.contactId}`);
      console.log(`   Start Time (input): ${appointmentData.startTime}`);

      // CRITICAL: Convert startTime to ISO 8601 string
      const startTimeMs = appointmentData.startTime;
      const startTimeISO = new Date(startTimeMs).toISOString();
      
      console.log(`   Start Time (ISO): ${startTimeISO}`);
      console.log(`   Title: ${appointmentData.title || "Appointment"}`);

      const payload = {
        calendarId: calendarId,
        locationId: this.locationId,
        contactId: appointmentData.contactId,
        startTime: startTimeISO, // ISO 8601 format required!
        title: appointmentData.title || "Appointment",
        appointmentStatus: "confirmed",
        assignedUserId: appointmentData.assignedUserId || "kt90MkHgpfkzwHXA4E5m", // Required field
      };

      console.log(`📤 [GHL] Payload:`, JSON.stringify(payload, null, 2));

      const url = `${this.baseUrl}/calendars/events/appointments`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ [GHL] Appointment creation failed:`);
        console.error(`   Status: ${response.status}`);
        console.error(`   Error:`, JSON.stringify(errorData, null, 2));
        
        // Provide helpful error messages
        if (response.status === 400 && errorData.message?.includes('no longer available')) {
          console.error(`
⚠️ SLOT UNAVAILABLE (400):
   The time slot you selected is not available.
   
   Possible reasons:
   1. Slot is already booked by someone else
   2. Time is outside calendar working hours
   3. Calendar preferences not configured (Slot Duration, Interval)
   4. Calendar is not published/active
   
   TO FIX:
   1. Check GHL → Settings → Calendars → [Your Calendar]
   2. Verify "Availability" tab has working hours set
   3. Verify "Preferences" tab has Slot Duration set (e.g., 30 min)
   4. Try a different date/time that you KNOW is empty
   5. Make sure calendar is Published (toggle at top-right)
          `);
        }
        
        throw new Error(
          errorData.message || `GHL API error: ${response.status}`
        );
      }

      const result = await response.json();
      console.log(`✅ [GHL] Appointment created successfully!`);
      console.log(`   Appointment ID: ${result.id}`);
      console.log(`   Status: ${result.status || 'confirmed'}`);

      return result;
    } catch (error) {
      console.error("❌ [GHL] Error creating appointment:", error.message);
      throw error;
    }
  }

  /**
   * Update contact custom fields
   */
  async updateContactCustomFields(contactId, customFields) {
    try {
      console.log(
        `[GHL] Updating contact ${contactId} with fields:`,
        customFields
      );

      // Convert object to array format required by GHL API
      // From: { booking_date: "2025-11-04", booking_hour: "10:00 AM" }
      // To: [{ key: "booking_date", field_value: "2025-11-04" }, ...]
      const customFieldsArray = Object.entries(customFields).map(([key, value]) => ({
        key: key,
        field_value: value
      }));

      console.log(`[GHL] Converted to array format:`, JSON.stringify(customFieldsArray, null, 2));

      const url = `${this.baseUrl}/contacts/${contactId}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customFields: customFieldsArray }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GHL] Contact update failed:", errorText);
        throw new Error(`Failed to update contact: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[GHL] Contact updated successfully`);

      return result;
    } catch (error) {
      console.error("[GHL] Error updating contact:", error.message);
      throw error;
    }
  }

  /**
   * Static mapping of GHL custom field IDs to keys
   * Built from actual GHL API responses since dynamic fetch requires additional permissions
   */
  getCustomFieldDefinitions() {
    // Hardcoded mapping based on your GHL location's custom fields
    const fieldMap = {
      "SeT9fAreSctxh4UwbVY7": "appointment_date",
      "nq38tJ2SMcNVMRAdkLTp": "appointment_time",
      "d7JRUzTZ60nkvxaRIQuk": "customer_timezone", // Also used as "timezone"
      "bR1W8sYoA547a5M1wdAg": "confirmation_status",
      "hXOKgc3cNzEYvqtN8eD7": "call_status",
      "n1CWRQjpas1nB4pJFDAt": "call_duration",
      "0qiZf2qMJ52zl0kRxVU7": "ended_reason",
      "XywdtgZhUHyIFvFqaK4S": "call_attempts",
      "TwwQBebJ10uRo1GezUxb": "last_call_time",
      "p6shP7yFlsZCshAeLtEn": "call_result",
      "1IrvCdBS7SKFFrRjeWnO": "next_call_scheduled",
    };
    
    console.log(`[GHL] ✅ Using static field mapping (${Object.keys(fieldMap).length} fields)`);
    return fieldMap;
  }

  /**
   * Get contact with parsed custom fields
   */
  async getContact(contactId) {
    try {
      console.log(`[GHL] Getting contact ${contactId}...`);

      const url = `${this.baseUrl}/contacts/${contactId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GHL] Get contact failed:", errorText);
        throw new Error(`Failed to get contact: ${response.status}`);
      }

      const result = await response.json();
      const contact = result.contact || result;

      // Get field ID to key mapping (static mapping)
      const fieldMap = this.getCustomFieldDefinitions();

      // Parse custom fields array into object
      if (contact.customFields && Array.isArray(contact.customFields)) {
        const parsedFields = {};
        
        contact.customFields.forEach((field) => {
          // GHL returns fields with "id" and "value" properties
          // We need to map the ID to the field key name
          let key = field.key || field.name || field.fieldKey;
          
          // If no key found, try to map from ID
          if (!key && field.id && fieldMap && fieldMap[field.id]) {
            key = fieldMap[field.id];
          }
          
          const value = field.value || field.field_value;
          
          if (key) {
            parsedFields[key] = value;
          }
        });
        
        contact.customFieldsParsed = parsedFields;
        console.log(`[GHL] ✅ Parsed ${Object.keys(parsedFields).length} custom fields`);
      }

      console.log(`[GHL] Contact retrieved successfully`);
      return contact;
    } catch (error) {
      console.error("[GHL] Error getting contact:", error.message);
      throw error;
    }
  }

  /**
   * Add tag to contact
   */
  async addTagToContact(contactId, tagName) {
    try {
      console.log(`[GHL] Adding tag "${tagName}" to contact ${contactId}...`);

      const url = `${this.baseUrl}/contacts/${contactId}/tags`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: [tagName] }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GHL] Could not add tag:`, errorText);
        throw new Error(`Failed to add tag: ${response.status}`);
      }

      console.log(`✅ Tag "${tagName}" added to contact`);
      return await response.json();
    } catch (error) {
      console.error(`[GHL] Error adding tag:`, error.message);
      throw error;
    }
  }

  /**
   * Send SMS to contact via GHL
   */
  async sendSMS(contactId, phoneNumber, message) {
    try {
      console.log(`[GHL] Sending SMS to ${phoneNumber}...`);

      const url = `${this.baseUrl}/conversations/messages`;

      const payload = {
        type: "SMS",
        contactId: contactId,
        phoneNumber: phoneNumber,
        message: message,
        locationId: this.locationId,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GHL] SMS send failed:`, errorText);
        throw new Error(`Failed to send SMS: ${response.status}`);
      }

      console.log(`✅ SMS sent successfully`);
      return await response.json();
    } catch (error) {
      console.error(`[GHL] Error sending SMS:`, error.message);
      throw error;
    }
  }

  /**
   * Get appointment details by ID
   */
  async getAppointment(appointmentId) {
    try {
      console.log(`[GHL] Getting appointment ${appointmentId}...`);

      const url = `${this.baseUrl}/calendars/events/appointments/${appointmentId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GHL] Get appointment failed:", errorText);
        throw new Error(`Failed to get appointment: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ [GHL] Appointment retrieved successfully`);
      return result;
    } catch (error) {
      console.error("[GHL] Error getting appointment:", error.message);
      throw error;
    }
  }

  /**
   * Cancel a calendar appointment by updating its status
   * Note: GHL API doesn't support DELETE endpoint, so we update status to "cancelled"
   */
  async cancelAppointment(appointmentId) {
    try {
      console.log(`🗑️ [GHL] Canceling appointment ${appointmentId}...`);

      const url = `${this.baseUrl}/calendars/events/appointments/${appointmentId}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentStatus: "cancelled" }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GHL] Cancel appointment failed:", errorText);
        throw new Error(`Failed to cancel appointment: ${response.status}`);
      }

      console.log(`✅ [GHL] Appointment ${appointmentId} cancelled successfully!`);
      return await response.json();
    } catch (error) {
      console.error("[GHL] Error canceling appointment:", error.message);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status) {
    try {
      console.log(`📝 [GHL] Updating appointment ${appointmentId} status to: ${status}`);

      const url = `${this.baseUrl}/calendars/events/appointments/${appointmentId}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentStatus: status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GHL] Update appointment failed:", errorText);
        throw new Error(`Failed to update appointment: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ [GHL] Appointment status updated successfully`);
      return result;
    } catch (error) {
      console.error("[GHL] Error updating appointment:", error.message);
      throw error;
    }
  }
}

module.exports = new GHLClient();

