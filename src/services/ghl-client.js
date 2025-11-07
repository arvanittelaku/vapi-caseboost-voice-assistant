const axios = require('axios');

class GHLClient {
  constructor() {
    // Support both abbreviated (GHL_*) and full (GOHIGHLEVEL_*) variable names
    this.apiKey = process.env.GHL_API_KEY || process.env.GOHIGHLEVEL_API_KEY;
    this.locationId = process.env.GHL_LOCATION_ID || process.env.GOHIGHLEVEL_LOCATION_ID;
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    
    if (!this.apiKey || !this.locationId) {
      throw new Error('GHL_API_KEY (or GOHIGHLEVEL_API_KEY) and GHL_LOCATION_ID (or GOHIGHLEVEL_LOCATION_ID) are required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new contact in GoHighLevel
   */
  async createContact(contactData) {
    try {
      const contact = {
        firstName: contactData.firstName || contactData.first_name,
        lastName: contactData.lastName || contactData.last_name,
        email: contactData.email,
        phone: contactData.phone,
        source: contactData.source || 'VAPI Voice Assistant',
        locationId: this.locationId,
        customFields: this.mapCustomFields(contactData),
        tags: contactData.tags || ['vapi-lead', 'voice-qualified'],
        address1: contactData.address1,
        city: contactData.city,
        state: contactData.state,
        country: contactData.country || 'UK',
        postalCode: contactData.postalCode || contactData.postcode
      };

      const response = await this.client.post('/contacts/', contact);
      console.log('✅ Contact created in GoHighLevel:', response.data.contact.id);
      return response.data.contact;
    } catch (error) {
      console.error('❌ Error creating contact:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId, updateData) {
    try {
      const contact = {
        customFields: this.mapCustomFields(updateData),
        tags: updateData.tags
      };

      const response = await this.client.put(`/contacts/${contactId}`, contact);
      console.log('✅ Contact updated in GoHighLevel');
      return response.data.contact;
    } catch (error) {
      console.error('❌ Error updating contact:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId) {
    try {
      const response = await this.client.get(`/contacts/${contactId}`);
      return response.data.contact;
    } catch (error) {
      console.error('❌ Error getting contact:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Search contacts by email or phone
   */
  async searchContact(email, phone) {
    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);
      
      const response = await this.client.get(`/contacts/?${params.toString()}`);
      return response.data.contacts;
    } catch (error) {
      console.error('❌ Error searching contact:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a task for follow-up
   */
  async createTask(contactId, taskData) {
    try {
      const task = {
        contactId: contactId,
        title: taskData.title || 'Follow-up call',
        body: taskData.body || 'Follow up with qualified lead',
        dueDate: taskData.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        assignedTo: taskData.assignedTo,
        locationId: this.locationId
      };

      const response = await this.client.post('/tasks/', task);
      console.log('✅ Task created in GoHighLevel');
      return response.data.task;
    } catch (error) {
      console.error('❌ Error creating task:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add a note to a contact
   */
  async addNote(contactId, noteData) {
    try {
      const note = {
        contactId: contactId,
        body: noteData.body,
        userId: noteData.userId,
        locationId: this.locationId
      };

      const response = await this.client.post('/notes/', note);
      console.log('✅ Note added to contact');
      return response.data.note;
    } catch (error) {
      console.error('❌ Error adding note:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Trigger a workflow
   */
  async triggerWorkflow(contactId, workflowId) {
    try {
      const workflowData = {
        contactId: contactId,
        workflowId: workflowId,
        locationId: this.locationId
      };

      const response = await this.client.post('/workflows/trigger', workflowData);
      console.log('✅ Workflow triggered');
      return response.data;
    } catch (error) {
      console.error('❌ Error triggering workflow:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Map custom fields from contact data - ENHANCED for qualification data
   */
  mapCustomFields(contactData) {
    const customFields = {};
    
    // Map CaseBoost-specific fields
    if (contactData.practice_area) {
      customFields['Practice Area'] = contactData.practice_area;
    }
    if (contactData.budget_range) {
      customFields['Budget Range'] = contactData.budget_range;
    }
    if (contactData.urgency) {
      customFields['Urgency Level'] = contactData.urgency;
    }
    if (contactData.lead_status || contactData.qualification_status) {
      customFields['Lead Status'] = contactData.lead_status || contactData.qualification_status;
    }
    if (contactData.next_action) {
      customFields['Next Action'] = contactData.next_action;
    }
    if (contactData.firm_name) {
      customFields['Firm Name'] = contactData.firm_name;
    }
    if (contactData.firm_size) {
      customFields['Firm Size'] = contactData.firm_size;
    }
    if (contactData.region) {
      customFields['Region'] = contactData.region;
    }
    if (contactData.consultation_scheduled) {
      customFields['Consultation Scheduled'] = contactData.consultation_scheduled;
    }
    if (contactData.call_notes) {
      customFields['Call Notes'] = contactData.call_notes;
    }
    
    // NEW QUALIFICATION FIELDS (add these to your GHL custom fields!)
    if (contactData.current_leads_per_month) {
      customFields['Current Leads Per Month'] = contactData.current_leads_per_month;
    }
    if (contactData.staff_count) {
      customFields['Staff Count'] = contactData.staff_count;
    }
    if (contactData.capacity_leads_per_month) {
      customFields['Capacity Leads Per Month'] = contactData.capacity_leads_per_month;
    }
    if (contactData.success_definition) {
      customFields['Success Definition'] = contactData.success_definition;
    }
    
    // Call metadata
    if (contactData.call_duration) {
      customFields['Last Call Duration'] = `${contactData.call_duration} seconds`;
    }
    if (contactData.call_status) {
      customFields['Last Call Status'] = contactData.call_status;
    }

    return customFields;
  }

  /**
   * Handle VAPI webhook data
   */
  async handleVAPIWebhook(webhookData) {
    try {
      const { type, call } = webhookData;
      
      if (type === 'call-ended') {
        await this.processCallEnd(call);
      } else if (type === 'call-started') {
        await this.processCallStart(call);
      } else if (type === 'function-call') {
        await this.processFunctionCall(call);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error handling VAPI webhook:', error.message);
      throw error;
    }
  }

  /**
   * Process call end event - ENHANCED for qualification data extraction
   */
  async processCallEnd(call) {
    try {
      // Option B: Search GHL by email/phone after call ends
      const email = call.customer?.email || call.metadata?.email;
      const phone = call.customer?.number || call.customer?.phone;
      
      if (!email && !phone) {
        console.error('❌ Cannot update GHL contact: no email or phone found');
        return;
      }
      
      // Search for contact in GHL
      const contacts = await this.searchContact(email, phone);
      if (!contacts || contacts.length === 0) {
        console.error('❌ Contact not found in GHL');
        return;
      }
      
      const contactId = contacts[0].id;
      console.log('✅ Found GHL contact:', contactId);

      // Extract structured data from call analysis (if available)
      const analysisData = call.analysis?.structuredData || {};
      const analysisSummary = call.analysis?.summary || '';
      
      // Add detailed call summary note
      const callSummary = this.generateEnhancedCallSummary(call, analysisData, analysisSummary);
      await this.addNote(contactId, {
        body: `📞 VAPI QUALIFICATION CALL COMPLETE\n\n${callSummary}`,
        userId: null
      });

      // Update contact with call results AND qualification data
      const updateData = {
        // Basic call info
        call_duration: call.duration,
        call_status: call.status,
        call_notes: analysisSummary || callSummary,
        
        // Verified/updated form fields (from analysisData)
        firm_name: analysisData.firmName || undefined,
        practice_area: analysisData.practiceArea || undefined,
        region: analysisData.practiceRegion || undefined,
        firm_size: analysisData.firmSize || undefined,
        
        // NEW QUALIFICATION DATA (this is the key part!)
        current_leads_per_month: analysisData.current_leads_per_month || undefined,
        staff_count: analysisData.staff_count || undefined,
        capacity_leads_per_month: analysisData.capacity_leads_per_month || undefined,
        success_definition: analysisData.success_definition || undefined,
        
        // Call outcome
        qualification_status: analysisData.qualification_status || 'pending',
        next_action: analysisData.next_action || undefined
      };

      await this.updateContact(contactId, updateData);

      // Create calendar appointment if meeting was requested
      if (analysisData.meeting_requested && analysisData.meeting_date && analysisData.meeting_time) {
        try {
          console.log('📅 Meeting requested - creating calendar appointment...');
          
          // Parse meeting date and time
          const { startTime, endTime } = this.parseMeetingDateTime(
            analysisData.meeting_date,
            analysisData.meeting_time,
            analysisData.meeting_timezone || 'America/New_York'
          );
          
          // Get the first available calendar (you can configure this)
          const calendars = await this.getCalendars();
          const calendarId = process.env.GOHIGHLEVEL_CALENDAR_ID || (calendars[0]?.id);
          
          if (!calendarId) {
            console.error('❌ No calendar found - cannot create appointment');
          } else {
            const appointment = await this.createCalendarAppointment(contactId, {
              calendarId: calendarId,
              startTime: startTime,
              endTime: endTime,
              title: `CaseBoost Consultation - ${analysisData.firmName || 'Prospect'}`,
              timezone: analysisData.meeting_timezone || 'America/New_York',
              notes: `Qualification call completed.\n\n` +
                `Success goal: ${analysisData.success_definition || 'Not specified'}\n` +
                `Current leads/month: ${analysisData.current_leads_per_month || 'Not captured'}\n` +
                `Capacity: ${analysisData.capacity_leads_per_month || 'Not captured'}`
            });
            
            console.log('✅ Calendar appointment created:', appointment.id);
            
            // Update contact with meeting scheduled flag
            await this.updateContact(contactId, {
              consultation_scheduled: 'Yes',
              next_action: `Meeting scheduled for ${analysisData.meeting_date} at ${analysisData.meeting_time}`
            });
          }
        } catch (error) {
          console.error('❌ Error creating calendar appointment:', error.message);
          // Continue processing even if calendar creation fails
        }
      }
      
      // Create follow-up task if qualified
      if (call.status === 'completed' && call.duration > 60) {
        const taskTitle = analysisData.qualification_status === 'qualified' 
          ? '🔥 Follow up with QUALIFIED lead'
          : '📞 Follow up on lead call';
        
        const taskBody = `Lead was called and ${analysisData.qualification_status || 'spoke with us'}.\n\n` +
          `Current leads: ${analysisData.current_leads_per_month || 'Not captured'}\n` +
          `Staff count: ${analysisData.staff_count || 'Not captured'}\n` +
          `Capacity: ${analysisData.capacity_leads_per_month || 'Not captured'}\n` +
          `Success goal: ${analysisData.success_definition || 'Not captured'}\n` +
          `Meeting requested: ${analysisData.meeting_requested ? 'Yes' : 'No'}\n` +
          `${analysisData.meeting_requested ? `Meeting: ${analysisData.meeting_date} at ${analysisData.meeting_time} ${analysisData.meeting_timezone}` : ''}\n\n` +
          `Next action: ${analysisData.next_action || 'TBD'}`;
        
        await this.createTask(contactId, {
          title: taskTitle,
          body: taskBody,
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        });
      }
      
      console.log('✅ GHL contact updated with qualification data and meeting');
    } catch (error) {
      console.error('❌ Error processing call end:', error.message);
    }
  }

  /**
   * Process call start event
   */
  async processCallStart(call) {
    try {
      const contactId = call.customerId;
      if (!contactId) return;

      await this.addNote(contactId, {
        body: `VAPI call started at ${new Date().toISOString()}`,
        userId: null
      });
    } catch (error) {
      console.error('❌ Error processing call start:', error.message);
    }
  }

  /**
   * Process function call from VAPI
   */
  async processFunctionCall(call) {
    try {
      const contactId = call.customerId;
      if (!contactId) return;

      const functionCall = call.functionCall;
      if (functionCall.name === 'update_lead_status') {
        const args = functionCall.parameters;
        await this.updateContact(contactId, args);
        
        // Trigger appropriate workflow
        if (args.lead_status === 'qualified') {
          await this.triggerWorkflow(contactId, 'qualified-lead-workflow');
        } else if (args.next_action === 'schedule_consultation') {
          await this.triggerWorkflow(contactId, 'consultation-workflow');
        }
      }
    } catch (error) {
      console.error('❌ Error processing function call:', error.message);
    }
  }

  /**
   * Generate call summary from call data
   */
  generateCallSummary(call) {
    const summary = [];
    
    summary.push(`Call Duration: ${call.duration || 0} seconds`);
    summary.push(`Call Status: ${call.status}`);
    summary.push(`End Reason: ${call.endReason || 'Unknown'}`);
    
    if (call.transcript) {
      summary.push(`Transcript: ${call.transcript.substring(0, 500)}...`);
    }
    
    if (call.summary) {
      summary.push(`AI Summary: ${call.summary}`);
    }

    return summary.join('\n');
  }

  /**
   * Generate ENHANCED call summary with qualification data
   */
  generateEnhancedCallSummary(call, analysisData, analysisSummary) {
    const summary = [];
    
    summary.push(`📊 CALL DETAILS:`);
    summary.push(`Duration: ${call.duration || 0} seconds`);
    summary.push(`Status: ${call.status}`);
    summary.push(`End Reason: ${call.endReason || 'Unknown'}`);
    summary.push('');
    
    if (analysisSummary) {
      summary.push(`📝 AI SUMMARY:`);
      summary.push(analysisSummary);
      summary.push('');
    }
    
    summary.push(`🎯 QUALIFICATION RESULTS:`);
    summary.push(`Current Leads/Month: ${analysisData.current_leads_per_month || 'Not captured'}`);
    summary.push(`Staff Count: ${analysisData.staff_count || 'Not captured'}`);
    summary.push(`Capacity (Leads/Month): ${analysisData.capacity_leads_per_month || 'Not captured'}`);
    summary.push(`Success Definition: ${analysisData.success_definition || 'Not captured'}`);
    summary.push(`Qualification Status: ${analysisData.qualification_status || 'Pending'}`);
    summary.push('');
    
    if (analysisData.firmName || analysisData.practiceArea) {
      summary.push(`🏢 FIRM INFO (Verified):`);
      if (analysisData.firmName) summary.push(`Firm: ${analysisData.firmName}`);
      if (analysisData.practiceArea) summary.push(`Practice Area: ${analysisData.practiceArea}`);
      if (analysisData.practiceRegion) summary.push(`Region: ${analysisData.practiceRegion}`);
      if (analysisData.firmSize) summary.push(`Size: ${analysisData.firmSize}`);
      summary.push('');
    }
    
    if (analysisData.next_action) {
      summary.push(`📅 NEXT ACTION: ${analysisData.next_action}`);
    }

    return summary.join('\n');
  }

  /**
   * Parse meeting date and time to ISO 8601 format
   * @param {string} date - Meeting date (e.g. "October 25, 2025" or "2025-10-25")
   * @param {string} time - Meeting time (e.g. "2:00 PM" or "14:00")
   * @param {string} timezone - Timezone (e.g. "America/New_York")
   * @returns {Object} - { startTime: ISO8601, endTime: ISO8601 }
   */
  parseMeetingDateTime(date, time, timezone = 'America/New_York') {
    try {
      // Parse date (try multiple formats)
      let dateStr = date;
      
      // Convert "October 25, 2025" to "2025-10-25"
      if (date.match(/[A-Za-z]/)) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
      }
      
      // Parse time (convert "2:00 PM" to 24-hour format "14:00")
      let hour = 0;
      let minute = 0;
      
      if (time.match(/AM|PM/i)) {
        const [timeStr, period] = time.split(/\s+/);
        const [h, m] = timeStr.split(':');
        hour = parseInt(h);
        minute = parseInt(m || 0);
        
        if (period.toUpperCase() === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period.toUpperCase() === 'AM' && hour === 12) {
          hour = 0;
        }
      } else {
        const [h, m] = time.split(':');
        hour = parseInt(h);
        minute = parseInt(m || 0);
      }
      
      // Build ISO 8601 string (simplified - without full timezone conversion)
      const startTime = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      
      // End time is 1 hour after start time
      const endHour = (hour + 1) % 24;
      const endTime = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      
      console.log(`📅 Parsed meeting: ${date} ${time} ${timezone} → ${startTime}`);
      
      return { startTime, endTime };
    } catch (error) {
      console.error('❌ Error parsing meeting date/time:', error.message);
      // Fallback: schedule for tomorrow at 2 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      
      const fallbackStart = tomorrow.toISOString();
      const fallbackEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString();
      
      return { startTime: fallbackStart, endTime: fallbackEnd };
    }
  }

  /**
   * Create calendar appointment (meeting)
   * @param {string} contactId - GHL contact ID
   * @param {Object} appointmentData - Appointment details
   * @returns {Promise<Object>} - Created appointment
   */
  async createCalendarAppointment(contactId, appointmentData) {
    try {
      const appointment = {
        calendarId: appointmentData.calendarId, // Required: GHL calendar ID
        contactId: contactId,
        startTime: appointmentData.startTime, // ISO 8601 format: "2025-10-23T14:00:00Z"
        endTime: appointmentData.endTime, // ISO 8601 format: "2025-10-23T15:00:00Z"
        title: appointmentData.title || 'CaseBoost Consultation',
        appointmentStatus: 'confirmed',
        locationId: this.locationId,
        notes: appointmentData.notes || 'Scheduled via VAPI voice assistant',
        timezone: appointmentData.timezone || 'America/New_York'
      };

      const response = await this.client.post('/appointments/', appointment);
      console.log('✅ Calendar appointment created:', response.data.appointment.id);
      return response.data.appointment;
    } catch (error) {
      console.error('❌ Error creating calendar appointment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get available calendar slots
   * @param {string} calendarId - GHL calendar ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} - Available slots
   */
  async getAvailableSlots(calendarId, startDate, endDate) {
    try {
      const params = {
        calendarId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      const response = await this.client.get('/calendars/slots', { params });
      console.log('✅ Available slots retrieved');
      return response.data.slots || [];
    } catch (error) {
      console.error('❌ Error getting available slots:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get calendars for the location
   * @returns {Promise<Array>} - List of calendars
   */
  async getCalendars() {
    try {
      const response = await this.client.get(`/calendars/?locationId=${this.locationId}`);
      console.log('✅ Calendars retrieved');
      return response.data.calendars || [];
    } catch (error) {
      console.error('❌ Error getting calendars:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test GoHighLevel connection
   */
  async testConnection() {
    try {
      console.log('🧪 Testing GoHighLevel connection...');
      
      const response = await this.client.get('/contacts/?limit=1');
      console.log('✅ GoHighLevel connection successful');
      
      return true;
    } catch (error) {
      console.error('❌ GoHighLevel connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = GHLClient;
