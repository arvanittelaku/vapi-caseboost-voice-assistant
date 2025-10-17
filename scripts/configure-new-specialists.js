/**
 * Configure New Specialist Assistants (Samantha, Whitney, Marcus, Taylor)
 * 
 * This script updates the 4 new VAPI assistants with their complete configurations
 * from the sub-agent config files.
 */

require('dotenv').config();
const axios = require('axios');
const samantha = require('../src/config/sub-agents/samantha-seo');
const whitney = require('../src/config/sub-agents/whitney-web-design');
const marcus = require('../src/config/sub-agents/marcus-crm');
const taylor = require('../src/config/sub-agents/taylor-mass-tort');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Assistant IDs (UPDATE THESE after creating assistants in VAPI dashboard)
const ASSISTANT_IDS = {
  samantha: process.env.SAMANTHA_ASSISTANT_ID || null,
  whitney: process.env.WHITNEY_ASSISTANT_ID || null,
  marcus: process.env.MARCUS_ASSISTANT_ID || null,
  taylor: process.env.TAYLOR_ASSISTANT_ID || null
};

/**
 * Configure a specialist assistant via VAPI API
 */
async function configureAssistant(name, config, assistantId) {
  if (!assistantId) {
    console.log(`⚠️  ${name}: No assistant ID provided. Please create the assistant in VAPI dashboard first.`);
    return;
  }

  console.log(`\n🔧 Configuring ${name}...`);

  const payload = {
    name: `${config.name} - ${config.role}`,
    firstMessage: config.greeting,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      systemPrompt: config.systemMessage,
      temperature: 0.7
    },
    voice: {
      provider: 'playht',
      voiceId: getVoiceId(name)
    }
  };

  try {
    const response = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${assistantId}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ ${name} configured successfully!`);
    console.log(`   - Name: ${response.data.name}`);
    console.log(`   - Voice: ${payload.voice.voiceId}`);
    console.log(`   - First Message: ${config.greeting.substring(0, 50)}...`);
  } catch (error) {
    console.error(`❌ Error configuring ${name}:`, error.response?.data || error.message);
  }
}

/**
 * Get appropriate voice ID for each specialist
 */
function getVoiceId(name) {
  const voiceMap = {
    'Samantha': 'emma',
    'Whitney': 'lisa',
    'Marcus': 'brian',
    'Taylor': 'david'
  };
  return voiceMap[name] || 'jennifer';
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Configuring New CaseBoost Specialist Assistants');
  console.log('================================================\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  // Check if any assistant IDs are provided
  const hasAnyId = Object.values(ASSISTANT_IDS).some(id => id !== null);
  
  if (!hasAnyId) {
    console.log('⚠️  No assistant IDs found!');
    console.log('\n📝 SETUP INSTRUCTIONS:');
    console.log('1. Create 4 new assistants in VAPI dashboard:');
    console.log('   - Samantha (SEO Specialist)');
    console.log('   - Whitney (Website Design Specialist)');
    console.log('   - Marcus (CRM Specialist)');
    console.log('   - Taylor (Mass Tort Specialist)');
    console.log('\n2. Add the assistant IDs to your .env file:');
    console.log('   SAMANTHA_ASSISTANT_ID=your-samantha-id');
    console.log('   WHITNEY_ASSISTANT_ID=your-whitney-id');
    console.log('   MARCUS_ASSISTANT_ID=your-marcus-id');
    console.log('   TAYLOR_ASSISTANT_ID=your-taylor-id');
    console.log('\n3. Run this script again: npm run configure-new-specialists');
    console.log('\n💡 TIP: You can configure them one at a time as you create them!');
    process.exit(0);
  }

  // Configure each specialist
  await configureAssistant('Samantha', samantha, ASSISTANT_IDS.samantha);
  await configureAssistant('Whitney', whitney, ASSISTANT_IDS.whitney);
  await configureAssistant('Marcus', marcus, ASSISTANT_IDS.marcus);
  await configureAssistant('Taylor', taylor, ASSISTANT_IDS.taylor);

  console.log('\n✅ Configuration complete!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Go to your VAPI Squad');
  console.log('2. Add the new assistants to the Squad');
  console.log('3. Update Sarah\'s system message (see docs/SARAH-UPDATED-SYSTEM-MESSAGE.md)');
  console.log('4. Test transfers to all specialists');
}

main();

