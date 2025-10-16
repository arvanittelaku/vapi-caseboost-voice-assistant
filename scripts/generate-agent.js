#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const VAPIClient = require('../src/services/vapi-client');

class AgentGenerator {
  constructor() {
    this.vapiClient = new VAPIClient();
    this.configPath = process.argv[2];
  }

  /**
   * Generate complete agent from configuration
   */
  async generateAgent() {
    try {
      console.log('🤖 Generating CaseBoost Voice Agent...\n');
      
      if (!this.configPath) {
        console.log('Using default CaseBoost configuration...');
        await this.generateFromDefaultConfig();
      } else {
        console.log(`Using configuration from: ${this.configPath}`);
        await this.generateFromConfigFile(this.configPath);
      }
      
      console.log('\n✅ Agent generation completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Agent generation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Generate agent from default CaseBoost configuration
   */
  async generateFromDefaultConfig() {
    try {
      // Load default configuration
      const config = require('../src/config/assistant-config');
      
      // Create assistant
      console.log('📝 Creating VAPI assistant...');
      const assistant = await this.vapiClient.createAssistant();
      console.log('✅ Assistant created:', assistant.id);
      
      // Update environment file
      await this.updateEnvironmentFile(assistant.id);
      
      // Generate deployment instructions
      await this.generateDeploymentInstructions(assistant);
      
    } catch (error) {
      throw new Error(`Default config generation failed: ${error.message}`);
    }
  }

  /**
   * Generate agent from custom configuration file
   */
  async generateFromConfigFile(configPath) {
    try {
      // Load custom configuration
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Create assistant with custom config
      console.log('📝 Creating VAPI assistant with custom configuration...');
      const assistant = await this.vapiClient.createAssistant();
      console.log('✅ Assistant created:', assistant.id);
      
      // Update environment file
      await this.updateEnvironmentFile(assistant.id);
      
      // Generate deployment instructions
      await this.generateDeploymentInstructions(assistant);
      
    } catch (error) {
      throw new Error(`Custom config generation failed: ${error.message}`);
    }
  }

  /**
   * Update environment file with assistant ID
   */
  async updateEnvironmentFile(assistantId) {
    try {
      const envPath = path.join(__dirname, '../.env');
      const envExamplePath = path.join(__dirname, '../env.example');
      
      // Read existing .env file or create from example
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      } else if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
      }
      
      // Update or add VAPI_ASSISTANT_ID
      if (envContent.includes('VAPI_ASSISTANT_ID=')) {
        envContent = envContent.replace(
          /VAPI_ASSISTANT_ID=.*/,
          `VAPI_ASSISTANT_ID=${assistantId}`
        );
      } else {
        envContent += `\nVAPI_ASSISTANT_ID=${assistantId}\n`;
      }
      
      // Write updated .env file
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Environment file updated');
      
    } catch (error) {
      console.error('⚠️  Could not update environment file:', error.message);
    }
  }

  /**
   * Generate deployment instructions
   */
  async generateDeploymentInstructions(assistant) {
    try {
      const instructions = {
        timestamp: new Date().toISOString(),
        assistantId: assistant.id,
        assistantName: assistant.name,
        status: 'created',
        nextSteps: [
          '1. Update your .env file with the VAPI_ASSISTANT_ID',
          '2. Run: npm run deploy',
          '3. Start webhook server: npm start',
          '4. Configure CRM webhooks',
          '5. Test with: npm run test-call <phone-number>'
        ],
        webhookUrls: {
          vapi: `${process.env.WEBHOOK_BASE_URL || 'https://yourdomain.com'}/webhook/vapi`,
          gohighlevel: `${process.env.WEBHOOK_BASE_URL || 'https://yourdomain.com'}/webhook/ghl`,
          twilio: `${process.env.WEBHOOK_BASE_URL || 'https://yourdomain.com'}/webhook/twilio`
        },
        configuration: {
          model: assistant.model?.model || 'gpt-4o',
          voice: assistant.voice?.voiceId || 'sarah',
          transcriber: assistant.transcriber?.model || 'nova-2',
          tools: assistant.tools?.length || 0,
          knowledgeBase: assistant.knowledgeBase?.length || 0
        }
      };
      
      // Write instructions to file
      const instructionsPath = path.join(__dirname, '../agent-instructions.json');
      fs.writeFileSync(instructionsPath, JSON.stringify(instructions, null, 2));
      
      console.log('📋 Deployment instructions generated: agent-instructions.json');
      
      // Display instructions
      console.log('\n📋 Next Steps:');
      instructions.nextSteps.forEach(step => console.log(`   ${step}`));
      
    } catch (error) {
      console.error('⚠️  Could not generate deployment instructions:', error.message);
    }
  }

  /**
   * Generate configuration template
   */
  generateConfigTemplate() {
    const template = {
      companyName: "Your Company Name",
      industry: "Your Industry",
      agentName: "Agent Name",
      primaryGoal: "Primary business objective",
      targetAudience: "Target customer segment",
      leadSource: "Lead source (Facebook Ads, Google Ads, etc.)",
      businessModel: "B2B/B2C/Service/etc.",
      pricingRange: "Price range",
      consultationDuration: "30 minutes",
      companyWebsite: "https://yourwebsite.com",
      contactEmail: "contact@yourwebsite.com",
      phoneNumber: "+1-XXX-XXX-XXXX",
      timezone: "EST/PST/etc.",
      businessHours: "9:00 AM - 6:00 PM EST",
      responseTime: "Within 24 hours",
      guarantee: "Your satisfaction guarantee",
      successMetrics: {
        clientSatisfaction: "98%",
        projectCompletion: "100%",
        averageRating: "4.9/5",
        projectsCompleted: "100+"
      },
      services: [
        {
          name: "Service Package 1",
          price: "$X,XXX - $X,XXX",
          description: "Service description",
          timeline: "X days"
        }
      ],
      conversationFlow: {
        greeting: "Hello {{contact.first_name}}, this is {{agentName}} from {{companyName}}...",
        objectives: [
          "Understand their needs",
          "Qualify the lead",
          "Schedule consultation"
        ],
        objectionHandling: {
          busy: "I understand you're busy...",
          not_interested: "No problem at all...",
          want_to_think: "Absolutely, that makes sense..."
        }
      },
      tools: [
        {
          name: "update_lead_status",
          description: "Updates lead status in CRM",
          parameters: {
            lead_status: ["qualified", "not_qualified", "callback_needed"],
            next_action: ["schedule_consultation", "send_info", "schedule_callback"]
          }
        }
      ],
      knowledgeBase: {
        services: "Your service descriptions",
        pricing: "Your pricing information",
        faq: "Common questions and answers",
        policies: "Your policies and guarantees"
      }
    };
    
    const templatePath = path.join(__dirname, '../agent-config-template.json');
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    
    console.log('📝 Configuration template generated: agent-config-template.json');
    console.log('Edit this file and run: npm run generate-agent agent-config-template.json');
  }
}

// Run generator if called directly
if (require.main === module) {
  const generator = new AgentGenerator();
  const command = process.argv[2];
  
  if (command === 'template') {
    generator.generateConfigTemplate();
  } else {
    generator.generateAgent();
  }
}

module.exports = AgentGenerator;
