const express = require('express');
const crypto = require('crypto');
const GHLClient = require('../services/ghl-client');
const SMSClient = require('../services/sms-client');
const TwilioVoiceService = require('../services/twilio-voice');
const SubAgentWebhook = require('./sub-agent-webhook');
const TransferWebhook = require('./transfer-webhook');
const ContextTransferWebhook = require('./context-transfer-webhook');
const contextManager = require('../services/context-manager');

class WebhookHandler {
  constructor() {
    this.app = express();
    this.ghlClient = new GHLClient();
    this.smsClient = new SMSClient();
    this.twilioVoice = new TwilioVoiceService();
    this.subAgentWebhook = new SubAgentWebhook();
    this.transferWebhook = new TransferWebhook();
    this.contextTransferWebhook = new ContextTransferWebhook();
    this.contextManager = contextManager;
    this.webhookSecret = process.env.WEBHOOK_SECRET;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup webhook routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'CaseBoost VAPI Webhook Handler',
        subAgentsEnabled: true
      });
    });

    // VAPI webhooks
    this.app.post('/webhook/vapi', this.handleVAPIWebhook.bind(this));
    
    // Context-aware transfer webhooks (NEW - with automatic summarization)
    this.app.use('/webhook/context', this.contextTransferWebhook.getRouter());
    
    // Transfer webhook (for Squad transfers)
    this.app.use('/webhook/vapi', this.transferWebhook.getRouter());
    
    // Sub-agent routing webhooks (legacy, kept for reference)
    this.app.use('/webhook/sub-agent', this.subAgentWebhook.getRouter());
    
    // GoHighLevel webhooks
    this.app.post('/webhook/ghl', this.handleGHLWebhook.bind(this));
    
    // Twilio webhooks
    this.app.post('/webhook/twilio/status', this.handleTwilioStatus.bind(this));
    this.app.post('/webhook/twilio/gather', this.handleTwilioGather.bind(this));
    this.app.post('/webhook/twilio/recording', this.handleTwilioRecording.bind(this));
    this.app.post('/webhook/twilio/transcription', this.handleTwilioTranscription.bind(this));
    this.app.post('/webhook/twilio/sms', this.handleTwilioSMS.bind(this));
    this.app.post('/webhook/twilio/voice', this.handleTwilioVoice.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Handle VAPI webhook events
   */
  async handleVAPIWebhook(req, res) {
    try {
      const webhookData = req.body;
      console.log('📞 VAPI Webhook received:', webhookData.type);

      // Verify webhook signature if secret is provided
      if (this.webhookSecret) {
        const signature = req.headers['x-vapi-signature'];
        if (!this.verifyWebhookSignature(req.body, signature)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { type, call } = webhookData;

      switch (type) {
        case 'call-started':
          await this.handleCallStarted(call);
          break;
        case 'call-ended':
          await this.handleCallEnded(call);
          break;
        case 'function-call':
          await this.handleFunctionCall(call);
          break;
        case 'transcript':
          await this.handleTranscript(call);
          break;
        case 'summary':
          await this.handleSummary(call);
          break;
        default:
          console.log('Unknown VAPI webhook type:', type);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error handling VAPI webhook:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle call started event
   */
  async handleCallStarted(call) {
    try {
      console.log(`📞 Call started: ${call.id}`);
      
      // Update GoHighLevel contact with call start
      if (call.customerId) {
        await this.ghlClient.addNote(call.customerId, {
          body: `VAPI call started at ${new Date().toISOString()}`,
          userId: null
        });
      }
    } catch (error) {
      console.error('❌ Error handling call started:', error.message);
    }
  }

  /**
   * Handle call ended event
   */
  async handleCallEnded(call) {
    try {
      console.log(`📞 Call ended: ${call.id}, Duration: ${call.duration}s, Status: ${call.status}`);
      
      if (call.customerId) {
        // Generate call summary
        const callSummary = this.generateCallSummary(call);
        
        // Add note to GoHighLevel
        await this.ghlClient.addNote(call.customerId, {
          body: `VAPI Call Summary:\n${callSummary}`,
          userId: null
        });

        // Update contact with call results
        const updateData = {
          call_duration: call.duration,
          call_status: call.status,
          call_notes: callSummary,
          last_call_date: new Date().toISOString()
        };

        await this.ghlClient.updateContact(call.customerId, updateData);

        // Create follow-up task if call was successful
        if (call.status === 'completed' && call.duration > 60) {
          await this.ghlClient.createTask(call.customerId, {
            title: 'Follow up on qualified lead',
            body: 'Lead was qualified during voice call - follow up required',
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
          });
        }

        // Send appropriate SMS follow-up
        const contact = await this.ghlClient.getContact(call.customerId);
        if (contact && contact.phone) {
          await this.sendFollowUpSMS(contact, call);
        }
      }
    } catch (error) {
      console.error('❌ Error handling call ended:', error.message);
    }
  }

  /**
   * Handle function call from VAPI
   */
  async handleFunctionCall(call) {
    try {
      console.log('🔧 Function call received:', call.functionCall?.name);
      
      if (call.customerId && call.functionCall) {
        const { name, parameters } = call.functionCall;
        
        if (name === 'update_lead_status') {
          await this.ghlClient.updateContact(call.customerId, parameters);
          
          // Trigger appropriate workflow
          if (parameters.lead_status === 'qualified') {
            await this.ghlClient.triggerWorkflow(call.customerId, 'qualified-lead-workflow');
          } else if (parameters.next_action === 'schedule_consultation') {
            await this.ghlClient.triggerWorkflow(call.customerId, 'consultation-workflow');
          }
        } else if (name === 'schedule_consultation') {
          // Handle consultation scheduling
          await this.handleConsultationScheduling(call.customerId, parameters);
        }
      }
    } catch (error) {
      console.error('❌ Error handling function call:', error.message);
    }
  }

  /**
   * Handle transcript updates
   */
  async handleTranscript(call) {
    try {
      console.log('📝 Transcript received for call:', call.id);
      
      // Record message in context manager for automatic summarization
      if (call.transcript && call.id) {
        const messages = call.transcript.split('\n').filter(m => m.trim());
        messages.forEach(msg => {
          const isUser = msg.toLowerCase().startsWith('user:') || msg.toLowerCase().startsWith('caller:');
          const role = isUser ? 'user' : 'assistant';
          const content = msg.replace(/^(user|caller|assistant):\s*/i, '').trim();
          
          if (content) {
            this.contextManager.addMessage(call.id, role, content, {
              agentName: isUser ? 'User' : (call.assistantName || 'Sarah'),
              callId: call.id,
              source: 'vapi-transcript'
            });
          }
        });
      }
      
      if (call.customerId && call.transcript) {
        await this.ghlClient.addNote(call.customerId, {
          body: `Call Transcript:\n${call.transcript}`,
          userId: null
        });
      }
    } catch (error) {
      console.error('❌ Error handling transcript:', error.message);
    }
  }

  /**
   * Handle AI summary
   */
  async handleSummary(call) {
    try {
      console.log('🤖 AI Summary received for call:', call.id);
      
      if (call.customerId && call.summary) {
        await this.ghlClient.addNote(call.customerId, {
          body: `AI Call Summary:\n${call.summary}`,
          userId: null
        });
      }
    } catch (error) {
      console.error('❌ Error handling summary:', error.message);
    }
  }

  /**
   * Handle GoHighLevel webhooks
   */
  async handleGHLWebhook(req, res) {
    try {
      const webhookData = req.body;
      console.log('📊 GoHighLevel webhook received:', webhookData.type);

      const { type, contact } = webhookData;

      switch (type) {
        case 'ContactCreated':
          await this.handleContactCreated(contact);
          break;
        case 'ContactUpdated':
          await this.handleContactUpdated(contact);
          break;
        case 'FormSubmitted':
          await this.handleFormSubmitted(webhookData);
          break;
        default:
          console.log('Unknown GHL webhook type:', type);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error handling GHL webhook:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle new contact creation
   */
  async handleContactCreated(contact) {
    try {
      console.log('👤 New contact created:', contact.email);
      
      // Check if contact should receive a VAPI call
      if (this.shouldCallContact(contact)) {
        // Schedule VAPI call
        await this.scheduleVAPICall(contact);
      }
    } catch (error) {
      console.error('❌ Error handling contact created:', error.message);
    }
  }

  /**
   * Handle contact updates
   */
  async handleContactUpdated(contact) {
    try {
      console.log('👤 Contact updated:', contact.email);
      
      // Handle specific updates that might trigger actions
      if (contact.customFields && contact.customFields['Lead Status'] === 'qualified') {
        await this.handleQualifiedLead(contact);
      }
    } catch (error) {
      console.error('❌ Error handling contact updated:', error.message);
    }
  }

  /**
   * Handle form submissions
   */
  async handleFormSubmitted(webhookData) {
    try {
      console.log('📝 Form submitted:', webhookData.formName);
      
      const contact = webhookData.contact;
      if (contact && this.shouldCallContact(contact)) {
        await this.scheduleVAPICall(contact);
      }
    } catch (error) {
      console.error('❌ Error handling form submitted:', error.message);
    }
  }

  /**
   * Handle Twilio status updates
   */
  async handleTwilioStatus(req, res) {
    try {
      const { CallSid, CallStatus, From, To } = req.body;
      console.log(`📞 Twilio call status: ${CallStatus} for ${CallSid}`);
      
      // Handle different call statuses
      switch (CallStatus) {
        case 'completed':
          console.log('Call completed successfully');
          break;
        case 'failed':
          console.log('Call failed');
          break;
        case 'busy':
          console.log('Call was busy');
          break;
        case 'no-answer':
          console.log('No answer');
          break;
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error handling Twilio status:', error.message);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle Twilio gather input
   */
  async handleTwilioGather(req, res) {
    try {
      const { Digits, CallSid } = req.body;
      console.log(`📞 Twilio gather input: ${Digits} for ${CallSid}`);
      
      const twiml = await this.twilioVoice.handleGatherInput(Digits, CallSid);
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error('❌ Error handling Twilio gather:', error.message);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle Twilio recording
   */
  async handleTwilioRecording(req, res) {
    try {
      const { RecordingUrl, CallSid, From } = req.body;
      console.log(`🎙️ Twilio recording received: ${RecordingUrl}`);
      
      // Process recording (save URL, transcribe, etc.)
      // In production, you might want to save this to your database
      
      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error handling Twilio recording:', error.message);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle Twilio transcription
   */
  async handleTwilioTranscription(req, res) {
    try {
      const { TranscriptionText, CallSid } = req.body;
      console.log(`📝 Twilio transcription: ${TranscriptionText}`);
      
      // Process transcription
      // In production, you might want to save this to your database
      
      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error handling Twilio transcription:', error.message);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle Twilio SMS
   */
  async handleTwilioSMS(req, res) {
    try {
      const { From, Body, To } = req.body;
      console.log(`📱 Twilio SMS received from ${From}: ${Body}`);
      
      await this.smsClient.handleIncomingSMS({ From, Body, To });
      
      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error handling Twilio SMS:', error.message);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle Twilio voice calls
   */
  async handleTwilioVoice(req, res) {
    try {
      const { From, To, CallSid } = req.body;
      console.log(`📞 Twilio voice call from ${From} to ${To}`);
      
      const twiml = await this.twilioVoice.handleIncomingCall(CallSid, From, To);
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error('❌ Error handling Twilio voice:', error.message);
      res.status(500).send('Error');
    }
  }

  /**
   * Generate call summary
   */
  generateCallSummary(call) {
    const summary = [];
    
    summary.push(`Call ID: ${call.id}`);
    summary.push(`Duration: ${call.duration || 0} seconds`);
    summary.push(`Status: ${call.status}`);
    summary.push(`End Reason: ${call.endReason || 'Unknown'}`);
    summary.push(`Timestamp: ${new Date().toISOString()}`);
    
    if (call.transcript) {
      summary.push(`Transcript: ${call.transcript.substring(0, 500)}...`);
    }
    
    if (call.summary) {
      summary.push(`AI Summary: ${call.summary}`);
    }

    return summary.join('\n');
  }

  /**
   * Send follow-up SMS based on call results
   */
  async sendFollowUpSMS(contact, call) {
    try {
      const practiceArea = contact.customFields?.['Practice Area'];
      const leadStatus = contact.customFields?.['Lead Status'];
      
      if (leadStatus === 'qualified') {
        await this.smsClient.sendBookingLink(contact.phone, contact.firstName, practiceArea);
      } else if (leadStatus === 'callback_needed') {
        await this.smsClient.sendFollowUp(contact.phone, contact.firstName, 'callback');
      } else if (call.duration > 30) {
        await this.smsClient.sendFollowUp(contact.phone, contact.firstName, 'general');
      }
    } catch (error) {
      console.error('❌ Error sending follow-up SMS:', error.message);
    }
  }

  /**
   * Determine if contact should receive a VAPI call
   */
  shouldCallContact(contact) {
    // Add logic to determine if contact should be called
    // For example, check custom fields, tags, etc.
    return contact.phone && contact.customFields?.['Lead Status'] !== 'do_not_call';
  }

  /**
   * Schedule VAPI call for contact
   */
  async scheduleVAPICall(contact) {
    try {
      // This would integrate with your VAPI client
      console.log(`📞 Scheduling VAPI call for ${contact.email}`);
      
      // In production, you might want to add this to a queue
      // or schedule it for a specific time
    } catch (error) {
      console.error('❌ Error scheduling VAPI call:', error.message);
    }
  }

  /**
   * Handle qualified lead
   */
  async handleQualifiedLead(contact) {
    try {
      console.log(`🎯 Qualified lead: ${contact.email}`);
      
      // Send booking link SMS
      if (contact.phone) {
        const practiceArea = contact.customFields?.['Practice Area'];
        await this.smsClient.sendBookingLink(contact.phone, contact.firstName, practiceArea);
      }
    } catch (error) {
      console.error('❌ Error handling qualified lead:', error.message);
    }
  }

  /**
   * Handle consultation scheduling
   */
  async handleConsultationScheduling(contactId, parameters) {
    try {
      console.log(`📅 Scheduling consultation for ${contactId}`);
      
      // Create task in GoHighLevel
      await this.ghlClient.createTask(contactId, {
        title: 'Schedule consultation',
        body: `Consultation requested for ${parameters.preferred_date} at ${parameters.preferred_time}`,
        dueDate: new Date().toISOString()
      });
      
      // Send confirmation SMS
      const contact = await this.ghlClient.getContact(contactId);
      if (contact && contact.phone) {
        await this.smsClient.sendAppointmentReminder(
          contact.phone, 
          contact.firstName, 
          `${parameters.preferred_date} at ${parameters.preferred_time}`
        );
      }
    } catch (error) {
      console.error('❌ Error handling consultation scheduling:', error.message);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Error handler
   */
  errorHandler(error, req, res, next) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }

  /**
   * Start the webhook server
   */
  start(port = process.env.PORT || 3000) {
    this.app.listen(port, () => {
      console.log(`🚀 CaseBoost webhook server running on port ${port}`);
      console.log(`📡 Webhook endpoints:`);
      console.log(`   - VAPI: http://localhost:${port}/webhook/vapi`);
      console.log(`   - Sub-Agent Routing: http://localhost:${port}/webhook/sub-agent/route-sub-agent`);
      console.log(`   - Sub-Agent Explain: http://localhost:${port}/webhook/sub-agent/explain-routing`);
      console.log(`   - Sub-Agent Stats: http://localhost:${port}/webhook/sub-agent/routing-stats`);
      console.log(`   - GoHighLevel: http://localhost:${port}/webhook/ghl`);
      console.log(`   - Twilio SMS: http://localhost:${port}/webhook/twilio/sms`);
      console.log(`   - Twilio Voice: http://localhost:${port}/webhook/twilio/voice`);
      console.log(`   - Health Check: http://localhost:${port}/health`);
      console.log(`\n🤖 Sub-Agents Active: Paula, Alex, Peter, Patricia`);
    });
  }
}

module.exports = WebhookHandler;
