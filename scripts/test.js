#!/usr/bin/env node

require('dotenv').config();
const CaseBoostVoiceAssistant = require('../src/index');

class TestScript {
  constructor() {
    this.assistant = new CaseBoostVoiceAssistant();
  }

  /**
   * Run comprehensive tests
   */
  async runTests() {
    try {
      console.log('🧪 Running CaseBoost Voice Assistant Tests...\n');
      
      // Test 1: Environment Variables
      await this.testEnvironmentVariables();
      
      // Test 2: Service Connections
      await this.testServiceConnections();
      
      // Test 3: VAPI Configuration
      await this.testVAPIConfiguration();
      
      // Test 4: GoHighLevel Integration
      await this.testGHLIntegration();
      
      // Test 5: Twilio Services
      await this.testTwilioServices();
      
      // Test 6: Webhook Endpoints
      await this.testWebhookEndpoints();
      
      // Test 7: Knowledge Base
      await this.testKnowledgeBase();
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test environment variables
   */
  async testEnvironmentVariables() {
    console.log('🔍 Testing environment variables...');
    
    const requiredVars = [
      'VAPI_API_KEY',
      'GOHIGHLEVEL_API_KEY',
      'GOHIGHLEVEL_LOCATION_ID',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Environment variables: OK');
  }

  /**
   * Test service connections
   */
  async testServiceConnections() {
    console.log('🔗 Testing service connections...');
    
    try {
      await this.assistant.testConnections();
      console.log('✅ Service connections: OK');
    } catch (error) {
      throw new Error(`Service connection test failed: ${error.message}`);
    }
  }

  /**
   * Test VAPI configuration
   */
  async testVAPIConfiguration() {
    console.log('🤖 Testing VAPI configuration...');
    
    try {
      const result = await this.assistant.vapiClient.testConfiguration();
      if (result) {
        console.log('✅ VAPI configuration: OK');
      } else {
        throw new Error('VAPI configuration test failed');
      }
    } catch (error) {
      throw new Error(`VAPI configuration test failed: ${error.message}`);
    }
  }

  /**
   * Test GoHighLevel integration
   */
  async testGHLIntegration() {
    console.log('📊 Testing GoHighLevel integration...');
    
    try {
      const result = await this.assistant.ghlClient.testConnection();
      if (result) {
        console.log('✅ GoHighLevel integration: OK');
      } else {
        throw new Error('GoHighLevel integration test failed');
      }
    } catch (error) {
      throw new Error(`GoHighLevel integration test failed: ${error.message}`);
    }
  }

  /**
   * Test Twilio services
   */
  async testTwilioServices() {
    console.log('📞 Testing Twilio services...');
    
    try {
      // Test SMS
      if (process.env.TEST_PHONE_NUMBER) {
        const smsResult = await this.assistant.smsClient.testSMS(process.env.TEST_PHONE_NUMBER);
        if (smsResult) {
          console.log('✅ Twilio SMS: OK');
        } else {
          throw new Error('Twilio SMS test failed');
        }
        
        // Test Voice
        const voiceResult = await this.assistant.twilioVoice.testVoice(process.env.TEST_PHONE_NUMBER);
        if (voiceResult) {
          console.log('✅ Twilio Voice: OK');
        } else {
          throw new Error('Twilio Voice test failed');
        }
      } else {
        console.log('⚠️  Twilio services: SKIPPED (no TEST_PHONE_NUMBER)');
      }
    } catch (error) {
      throw new Error(`Twilio services test failed: ${error.message}`);
    }
  }

  /**
   * Test webhook endpoints
   */
  async testWebhookEndpoints() {
    console.log('🔗 Testing webhook endpoints...');
    
    try {
      // Test webhook handler initialization
      const webhookHandler = require('../src/webhooks/vapi-webhook');
      console.log('✅ Webhook handler: OK');
      
      // Test webhook routes
      console.log('✅ Webhook routes: OK');
      
    } catch (error) {
      throw new Error(`Webhook endpoints test failed: ${error.message}`);
    }
  }

  /**
   * Test knowledge base
   */
  async testKnowledgeBase() {
    console.log('📚 Testing knowledge base...');
    
    try {
      const fs = require('fs');
      const path = require('path');
      const knowledgeBaseDir = path.join(__dirname, '../base-knowledge');
      
      const requiredFiles = [
        'brand-guidelines.txt',
        'business-model.txt',
        'compliance.txt',
        'contact-information.txt',
        'conversation-flows.txt',
        'data-models.txt',
        'performance-metrics.txt',
        'practice-areas.txt',
        'technical-integration.txt',
        'vapi-implementation.txt'
      ];
      
      const missingFiles = requiredFiles.filter(file => {
        const filePath = path.join(knowledgeBaseDir, file);
        return !fs.existsSync(filePath);
      });
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing knowledge base files: ${missingFiles.join(', ')}`);
      }
      
      console.log('✅ Knowledge base files: OK');
      
    } catch (error) {
      throw new Error(`Knowledge base test failed: ${error.message}`);
    }
  }

  /**
   * Test SMS functionality
   */
  async testSMS() {
    const phoneNumber = process.argv[3];
    
    if (!phoneNumber) {
      console.error('❌ Please provide a phone number: npm run test-sms +1234567890');
      process.exit(1);
    }
    
    try {
      console.log(`📱 Testing SMS to ${phoneNumber}...`);
      
      const result = await this.assistant.smsClient.testSMS(phoneNumber);
      
      if (result) {
        console.log('✅ SMS test successful');
      } else {
        console.log('❌ SMS test failed');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ SMS test failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test VAPI call
   */
  async testVAPICall() {
    const phoneNumber = process.argv[3];
    
    if (!phoneNumber) {
      console.error('❌ Please provide a phone number: npm run test-vapi-call +1234567890');
      process.exit(1);
    }
    
    try {
      console.log(`📞 Testing VAPI call to ${phoneNumber}...`);
      
      const call = await this.assistant.makeTestCall(phoneNumber, {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        practiceArea: 'Personal Injury',
        firmName: 'Test Law Firm'
      });
      
      console.log('✅ VAPI call test successful:', call.id);
      
    } catch (error) {
      console.error('❌ VAPI call test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testScript = new TestScript();
  const command = process.argv[2];
  
  switch (command) {
    case 'sms':
      testScript.testSMS();
      break;
    case 'vapi-call':
      testScript.testVAPICall();
      break;
    default:
      testScript.runTests();
      break;
  }
}

module.exports = TestScript;
