require('dotenv').config();
const axios = require('axios');

// Your Squad and Assistant IDs
const SQUAD_ID = 'a00c8a4d-052f-4025-8cf8-4389822fa510'; // From your screenshots
const ASSISTANT_IDS = {
  sarah: '87bbafd3-e24d-4de6-ac76-9ec93d180571',
  paula: '8c09f5c7-c1f8-4015-b632-19b51456b522',
  alex: 'c27cd255-230c-4a00-bd0d-8fb0dd97976a',
  peter: '11a75fe5-0bbf-4c09-99bc-548830cd6af8',
  patricia: 'e3152d1f-4e00-44f3-a5de-5125bbde4cc6'
};

const VAPI_API_KEY = 'c4b1fe40-f188-4a21-b405-91b3119f6a3f';
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Create axios client
const client = axios.create({
  baseURL: VAPI_BASE_URL,
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function enableRollingHistoryMode() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔄 ENABLING ROLLING-HISTORY MODE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📋 Configuration:');
  console.log(`   Squad ID: ${SQUAD_ID}`);
  console.log(`   Sarah ID: ${ASSISTANT_IDS.sarah}\n`);

  try {
    // Method 1: Try to update Squad configuration directly
    console.log('🔧 Attempting to update Squad configuration...\n');

    const squadConfig = {
      members: [
        {
          assistantId: ASSISTANT_IDS.sarah,
          assistantDestinations: [
            {
              message: "Let me connect you with Paula, our Performance Lead Delivery specialist.",
              description: "Specialist in immediate lead delivery and performance-based client acquisition",
              type: "assistant",
              assistantName: "Paula - Performance Leads",
              assistant: ASSISTANT_IDS.paula,
              transferMode: "rolling-history"  // KEY: Enable context preservation
            },
            {
              message: "I'll connect you with Alex, our AI Intake specialist.",
              description: "Specialist in AI-powered client intake automation and 24/7 lead capture",
              type: "assistant",
              assistantName: "Alex - AI Intake",
              assistant: ASSISTANT_IDS.alex,
              transferMode: "rolling-history"
            },
            {
              message: "Let me get Peter on the line, our PPC specialist.",
              description: "Specialist in PPC advertising for law firms, Google Ads, and Meta campaigns",
              type: "assistant",
              assistantName: "Peter - PPC",
              assistant: ASSISTANT_IDS.peter,
              transferMode: "rolling-history"
            },
            {
              message: "I'll connect you with Patricia, our Practice Area consultant.",
              description: "Specialist in practice area growth for medical malpractice, personal injury, immigration, and family law",
              type: "assistant",
              assistantName: "Patricia - Practice Areas",
              assistant: ASSISTANT_IDS.patricia,
              transferMode: "rolling-history"
            }
          ]
        },
        {
          assistantId: ASSISTANT_IDS.paula,
          assistantDestinations: []  // No transfers from specialists
        },
        {
          assistantId: ASSISTANT_IDS.alex,
          assistantDestinations: []
        },
        {
          assistantId: ASSISTANT_IDS.peter,
          assistantDestinations: []
        },
        {
          assistantId: ASSISTANT_IDS.patricia,
          assistantDestinations: []
        }
      ],
      name: "CaseBoost Squad"
    };

    const response = await client.patch(`/squad/${SQUAD_ID}`, squadConfig);
    
    console.log('✅ Squad configuration updated successfully!');
    console.log('   - Rolling-history mode ENABLED for all transfers');
    console.log('   - Context will be preserved across transfers');
    console.log('   - Specialists will see the full conversation history\n');

    console.log('📊 Transfer Configuration:');
    console.log('   Sarah → Paula:    rolling-history ✅');
    console.log('   Sarah → Alex:     rolling-history ✅');
    console.log('   Sarah → Peter:    rolling-history ✅');
    console.log('   Sarah → Patricia: rolling-history ✅\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ CONFIGURATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🧪 NEXT STEP: TEST CONTEXT PRESERVATION\n');
    console.log('Run: npm run test-vapi-call +12132127052\n');
    console.log('Test phrase: "Hi, I\'m Dr. Chen from Chen Medical. We need immediate qualified leads for personal injury."\n');
    console.log('Expected: Paula should know:');
    console.log('  - Your name (Dr. Chen)');
    console.log('  - Your firm (Chen Medical)');
    console.log('  - Your need (qualified leads)');
    console.log('  - Your practice area (personal injury)\n');

  } catch (error) {
    console.error('❌ Error updating Squad configuration:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n⚠️  Squad API endpoint not found.');
      console.log('   This might mean:');
      console.log('   1. The Squad ID is incorrect');
      console.log('   2. VAPI API doesn\'t support Squad updates yet');
      console.log('   3. You need to configure this in the dashboard\n');
      
      console.log('📋 MANUAL CONFIGURATION STEPS:\n');
      console.log('1. Go to: https://dashboard.vapi.ai/squads/' + SQUAD_ID);
      console.log('2. Click on Sarah (CaseBoost Legal Assistant)');
      console.log('3. In Destination Settings, for each destination:');
      console.log('   - Click the destination');
      console.log('   - Look for "Transfer Mode" or "Context Preservation"');
      console.log('   - Set to "rolling-history"');
      console.log('   - Save\n');
      console.log('4. Repeat for all 4 destinations (Paula, Alex, Peter, Patricia)\n');
    }

    if (error.response?.data?.message) {
      console.log('\n📝 API Error Details:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }

    console.log('\n💡 Alternative: Test current setup first');
    console.log('   VAPI Squads may have rolling-history enabled by default.');
    console.log('   Try making a test call and see if context is preserved!\n');
  }
}

// Run the configuration
if (require.main === module) {
  enableRollingHistoryMode();
}

module.exports = { enableRollingHistoryMode };

