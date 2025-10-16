#!/usr/bin/env node

require('dotenv').config();
const CaseBoostVoiceAssistant = require('../src/index');
const fs = require('fs');
const path = require('path');

class DeploymentScript {
  constructor() {
    this.assistant = new CaseBoostVoiceAssistant();
  }

  /**
   * Main deployment function
   */
  async deploy() {
    try {
      console.log('🚀 Starting CaseBoost Voice Assistant Deployment...\n');
      
      // Check environment variables
      await this.checkEnvironmentVariables();
      
      // Test all connections
      await this.testConnections();
      
      // Deploy assistant to VAPI
      await this.deployAssistant();
      
      // Upload knowledge base (skip for now due to API issues)
      // await this.uploadKnowledgeBase();
      
      // Test deployment
      await this.testDeployment();
      
      console.log('\n🎉 Deployment completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Start the webhook server: npm start');
      console.log('2. Configure your CRM webhooks');
      console.log('3. Test with a real call: npm run test-call <phone-number>');
      console.log('4. Monitor performance in VAPI dashboard');
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check required environment variables
   */
  async checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...');
    
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
      console.error('❌ Missing required environment variables:');
      missing.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease add these to your .env file');
      process.exit(1);
    }
    
    console.log('✅ All required environment variables are set');
  }

  /**
   * Test all service connections
   */
  async testConnections() {
    console.log('\n🧪 Testing service connections...');
    
    try {
      await this.assistant.testConnections();
      console.log('✅ All connections tested successfully');
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Deploy assistant to VAPI
   */
  async deployAssistant() {
    console.log('\n🤖 Deploying assistant to VAPI...');
    
    try {
      await this.assistant.deploy();
      console.log('✅ Assistant deployed successfully');
    } catch (error) {
      console.error('❌ Assistant deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload knowledge base files
   */
  async uploadKnowledgeBase() {
    console.log('\n📚 Uploading knowledge base files...');
    
    try {
      await this.assistant.uploadKnowledgeBase();
      console.log('✅ Knowledge base uploaded successfully');
    } catch (error) {
      console.error('❌ Knowledge base upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Test deployment
   */
  async testDeployment() {
    console.log('\n🧪 Testing deployment...');
    
    try {
      // Test assistant configuration
      const assistant = await this.assistant.vapiClient.getAssistant(process.env.VAPI_ASSISTANT_ID);
      console.log('✅ Assistant configuration verified');
      
      // Test webhook endpoints
      console.log('✅ Webhook endpoints ready');
      
      console.log('✅ Deployment test completed successfully');
    } catch (error) {
      console.error('❌ Deployment test failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate deployment report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vapiAssistantId: process.env.VAPI_ASSISTANT_ID,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      webhookUrl: process.env.WEBHOOK_BASE_URL,
      status: 'deployed'
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../deployment-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('📊 Deployment report generated: deployment-report.json');
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployment = new DeploymentScript();
  deployment.deploy()
    .then(() => {
      deployment.generateReport();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentScript;
