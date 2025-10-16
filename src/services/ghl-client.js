const axios = require('axios');

class GHLClient {
  constructor() {
    this.apiKey = process.env.GOHIGHLEVEL_API_KEY;
    this.locationId = process.env.GOHIGHLEVEL_LOCATION_ID;
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    
    if (!this.apiKey || !this.locationId) {
      throw new Error('GOHIGHLEVEL_API_KEY and GOHIGHLEVEL_LOCATION_ID are required');
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
   * Map custom fields from contact data
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
    if (contactData.lead_status) {
      customFields['Lead Status'] = contactData.lead_status;
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
   * Process call end event
   */
  async processCallEnd(call) {
    try {
      const contactId = call.customerId;
      if (!contactId) return;

      // Add call summary note
      const callSummary = this.generateCallSummary(call);
      await this.addNote(contactId, {
        body: `VAPI Call Summary:\n${callSummary}`,
        userId: null
      });

      // Update contact with call results
      const updateData = {
        call_duration: call.duration,
        call_status: call.status,
        call_notes: callSummary
      };

      await this.updateContact(contactId, updateData);

      // Create follow-up task if needed
      if (call.status === 'completed' && call.duration > 60) {
        await this.createTask(contactId, {
          title: 'Follow up on qualified lead',
          body: 'Lead was qualified during voice call - follow up required',
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        });
      }
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
