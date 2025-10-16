require('dotenv').config();
const WebhookHandler = require('./webhooks/vapi-webhook');
const VAPIClient = require('./services/vapi-client');
const GHLClient = require('./services/ghl-client');
const SMSClient = require('./services/sms-client');
const TwilioVoiceService = require('./services/twilio-voice');

class CaseBoostVoiceAssistant {
  constructor() {
    this.webhookHandler = new WebhookHandler();
    this.vapiClient = new VAPIClient();
    this.ghlClient = new GHLClient();
    this.smsClient = new SMSClient();
    this.twilioVoice = new TwilioVoiceService();
  }

  /**
   * Initialize the voice assistant system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing CaseBoost Voice Assistant...');
      
      // Test all connections
      await this.testConnections();
      
      // Start webhook server
      this.webhookHandler.start();
      
      console.log('✅ CaseBoost Voice Assistant initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize voice assistant:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test all service connections
   */
  async testConnections() {
    console.log('🧪 Testing service connections...');
    
    const tests = [
      { name: 'VAPI', test: () => this.vapiClient.testConfiguration() },
      { name: 'GoHighLevel', test: () => this.ghlClient.testConnection() },
      { name: 'SMS', test: () => this.smsClient.testSMS(process.env.TEST_PHONE_NUMBER) },
      { name: 'Twilio Voice', test: () => this.twilioVoice.testVoice(process.env.TEST_PHONE_NUMBER) }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        console.log(`✅ ${test.name} connection: ${result ? 'OK' : 'FAILED'}`);
      } catch (error) {
        console.log(`❌ ${test.name} connection: FAILED - ${error.message}`);
      }
    }
  }

  /**
   * Deploy the assistant to VAPI
   */
  async deploy() {
    try {
      console.log('🚀 Deploying CaseBoost assistant to VAPI...');
      
      if (process.env.VAPI_ASSISTANT_ID) {
        // Update existing assistant
        await this.vapiClient.updateAssistant(process.env.VAPI_ASSISTANT_ID);
        console.log('✅ Assistant updated successfully');
      } else {
        // Create new assistant
        const assistant = await this.vapiClient.createAssistant();
        console.log('✅ Assistant created successfully');
        console.log(`📝 Add this to your .env file: VAPI_ASSISTANT_ID=${assistant.id}`);
      }
      
      // Upload knowledge base files (skip for now due to API issues)
      // await this.uploadKnowledgeBase();
      
      console.log('🎉 Deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload knowledge base files to VAPI
   */
  async uploadKnowledgeBase() {
    try {
      console.log('📚 Uploading knowledge base files...');
      
      const fs = require('fs');
      const path = require('path');
      const knowledgeBaseDir = path.join(__dirname, '../base-knowledge');
      
      const files = fs.readdirSync(knowledgeBaseDir);
      
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const filePath = path.join(knowledgeBaseDir, file);
          await this.vapiClient.uploadKnowledgeBaseFile(filePath, file);
        }
      }
      
      console.log('✅ Knowledge base uploaded successfully');
    } catch (error) {
      console.error('❌ Error uploading knowledge base:', error.message);
      throw error;
    }
  }

  /**
   * Make a test call
   */
  async makeTestCall(phoneNumber, contactData = {}) {
    try {
      console.log(`📞 Making test call to ${phoneNumber}...`);
      
      const call = await this.vapiClient.makeCall(phoneNumber, {
        firstName: contactData.firstName || 'Test',
        lastName: contactData.lastName || 'User',
        email: contactData.email || 'test@example.com',
        phone: phoneNumber,
        practice_area: contactData.practiceArea || 'Personal Injury',
        firm_name: contactData.firmName || 'Test Law Firm',
        ...contactData
      });
      
      console.log('✅ Test call initiated:', call.id);
      return call;
    } catch (error) {
      console.error('❌ Error making test call:', error.message);
      throw error;
    }
  }

  /**
   * Process a lead from GoHighLevel
   */
  async processLead(contactData) {
    try {
      console.log('👤 Processing lead:', contactData.email);
      
      // Create contact in GoHighLevel if not exists
      let contact = await this.ghlClient.searchContact(contactData.email, contactData.phone);
      
      if (contact.length === 0) {
        contact = await this.ghlClient.createContact(contactData);
      } else {
        contact = contact[0];
      }
      
      // Schedule VAPI call
      if (contact.phone) {
        await this.makeTestCall(contact.phone, {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          practiceArea: contactData.practice_area,
          firmName: contactData.firm_name
        });
      }
      
      return contact;
    } catch (error) {
      console.error('❌ Error processing lead:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const assistant = new CaseBoostVoiceAssistant();
  
  switch (command) {
    case 'start':
      assistant.initialize();
      break;
    case 'deploy':
      assistant.deploy();
      break;
    case 'test-call':
      const phoneNumber = process.argv[3];
      if (!phoneNumber) {
        console.error('❌ Please provide a phone number: npm run test-call +1234567890');
        process.exit(1);
      }
      assistant.makeTestCall(phoneNumber);
      break;
    case 'test-connections':
      assistant.testConnections();
      break;
    default:
      console.log('Usage:');
      console.log('  npm start                    - Start webhook server');
      console.log('  npm run deploy              - Deploy assistant to VAPI');
      console.log('  npm run test-call <number>   - Make test call');
      console.log('  npm run test-connections    - Test all connections');
      break;
  }
}

module.exports = CaseBoostVoiceAssistant;
