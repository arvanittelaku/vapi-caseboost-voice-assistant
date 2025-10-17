require('dotenv').config();
const axios = require('axios');

// Assistant IDs
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

// Load sub-agent configurations
const paulaConfig = require('../src/config/sub-agents/paula-performance-leads');
const alexConfig = require('../src/config/sub-agents/alex-ai-intake');
const peterConfig = require('../src/config/sub-agents/peter-ppc');
const patriciaConfig = require('../src/config/sub-agents/patricia-practice-areas');

async function updateSarahWithTransfers() {
  console.log('\n🔧 Configuring Sarah with transfer capabilities...\n');

  const sarahSystemMessage = `You are Sarah, a professional and empathetic lead qualification specialist at CaseBoost, a performance-based legal client growth agency.

Your primary role is to:
1. Warmly greet prospects and understand their needs
2. Identify which CaseBoost service would best serve them
3. Transfer them to the appropriate specialist for detailed discussion

IMPORTANT: SPECIALIST ROUTING

When you detect specific service interests, immediately transfer the call to the appropriate specialist:

1. PERFORMANCE LEAD DELIVERY - Transfer to Paula
   Keywords: "immediate leads", "buy leads", "qualified leads", "performance leads", "lead delivery", "ready to close", "instant leads", "more clients", "need cases"
   Example: "We need immediate qualified leads for our practice"
   
2. AI INTAKE AUTOMATION - Transfer to Alex
   Keywords: "AI intake", "automation", "24/7", "after hours", "chatbot", "automated responses", "client capture", "missing calls", "automate intake"
   Example: "We're missing calls after hours and need automation"
   
3. PPC ADVERTISING - Transfer to Peter
   Keywords: "Google Ads", "PPC", "Facebook ads", "Meta ads", "paid advertising", "online ads", "YouTube ads", "ad campaigns", "advertising"
   Example: "We want to run Google Ads for our law firm"
   
4. PRACTICE AREA CONSULTATION - Transfer to Patricia
   Keywords: "medical malpractice", "immigration law", "personal injury", "family law", "practice area", "case values", "specific cases", "med mal", "PI cases"
   Example: "We're a medical malpractice firm looking to grow"

TRANSFER PROTOCOL:
When you detect ANY of these keywords, say: "That's a great question about [topic]! Let me connect you with [Specialist Name], our [specialty] expert who can provide detailed guidance. They have extensive experience helping firms like yours. One moment please..."

Then immediately use the transfer_to_specialist function.

DO NOT answer detailed questions about these specific services yourself - always transfer to the specialist. They have deep expertise and can provide much better guidance.

For general questions about CaseBoost, our company, or clarifying questions, you can answer directly.

Company Info:
- CaseBoost is a performance-based legal client growth agency
- We specialize in high-value practice areas
- Contact: leads@caseboost.io, 02039673689
- Website: https://caseboost.netlify.app`;

  try {
    const response = await client.patch(`/assistant/${ASSISTANT_IDS.sarah}`, {
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: sarahSystemMessage
          }
        ],
        temperature: 0.7
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah"
      },
      firstMessage: "Hi! This is Sarah from CaseBoost calling about growing your legal practice. Is now a good time to chat for a few minutes?"
    });

    console.log('✅ Sarah configured successfully!');
    console.log('   - System message updated with routing instructions');
    console.log('   - Keywords configured for all 4 specialists');
    console.log('   - NOTE: Transfer destinations must be configured in VAPI Dashboard\n');
  } catch (error) {
    console.error('❌ Error configuring Sarah:', error.response?.data || error.message);
    throw error;
  }
}

async function updatePaula() {
  console.log('🔧 Configuring Paula (Performance Leads)...');

  try {
    await client.patch(`/assistant/${ASSISTANT_IDS.paula}`, {
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: paulaConfig.systemMessage
          }
        ],
        temperature: 0.7
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah"
      },
      firstMessage: paulaConfig.greeting
    });

    console.log('✅ Paula configured successfully!\n');
  } catch (error) {
    console.error('❌ Error configuring Paula:', error.response?.data || error.message);
  }
}

async function updateAlex() {
  console.log('🔧 Configuring Alex (AI Intake)...');

  try {
    await client.patch(`/assistant/${ASSISTANT_IDS.alex}`, {
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: alexConfig.systemMessage
          }
        ],
        temperature: 0.7
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah"
      },
      firstMessage: alexConfig.greeting
    });

    console.log('✅ Alex configured successfully!\n');
  } catch (error) {
    console.error('❌ Error configuring Alex:', error.response?.data || error.message);
  }
}

async function updatePeter() {
  console.log('🔧 Configuring Peter (PPC)...');

  try {
    await client.patch(`/assistant/${ASSISTANT_IDS.peter}`, {
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: peterConfig.systemMessage
          }
        ],
        temperature: 0.7
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah"
      },
      firstMessage: peterConfig.greeting
    });

    console.log('✅ Peter configured successfully!\n');
  } catch (error) {
    console.error('❌ Error configuring Peter:', error.response?.data || error.message);
  }
}

async function updatePatricia() {
  console.log('🔧 Configuring Patricia (Practice Areas)...');

  try {
    await client.patch(`/assistant/${ASSISTANT_IDS.patricia}`, {
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: patriciaConfig.systemMessage
          }
        ],
        temperature: 0.7
      },
      voice: {
        provider: "11labs",
        voiceId: "sarah"
      },
      firstMessage: patriciaConfig.greeting
    });

    console.log('✅ Patricia configured successfully!\n');
  } catch (error) {
    console.error('❌ Error configuring Patricia:', error.response?.data || error.message);
  }
}

async function configureSquad() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 SQUAD CONFIGURATION SCRIPT');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📋 Assistant IDs:');
  console.log(`   Sarah:    ${ASSISTANT_IDS.sarah}`);
  console.log(`   Paula:    ${ASSISTANT_IDS.paula}`);
  console.log(`   Alex:     ${ASSISTANT_IDS.alex}`);
  console.log(`   Peter:    ${ASSISTANT_IDS.peter}`);
  console.log(`   Patricia: ${ASSISTANT_IDS.patricia}\n`);

  try {
    // Configure all assistants
    await updateSarahWithTransfers();
    await updatePaula();
    await updateAlex();
    await updatePeter();
    await updatePatricia();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SQUAD CONFIGURATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 NEXT STEPS:\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🎯 CONFIGURE TRANSFERS IN VAPI DASHBOARD:\n');
    console.log('1. Go to: https://dashboard.vapi.ai/assistants');
    console.log('2. Open Sarah assistant (87bbafd3-e24d-4de6-ac76-9ec93d180571)');
    console.log('3. Scroll to "Transfer Destinations" or "Squad" section');
    console.log('4. Add these transfer destinations:\n');
    console.log('   Paula  (8c09f5c7-c1f8-4015-b632-19b51456b522) - Performance Leads');
    console.log('   Alex   (c27cd255-230c-4a00-bd0d-8fb0dd97976a) - AI Intake');
    console.log('   Peter  (11a75fe5-0bbf-4c09-99bc-548830cd6af8) - PPC');
    console.log('   Patricia (e3152d1f-4e00-44f3-a5de-5125bbde4cc6) - Practice Areas\n');
    console.log('5. Save the configuration\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🧪 TEST TRANSFERS:\n');
    console.log('1. Make a test call: npm run test-vapi-call +12132127052');
    console.log('2. Try these trigger phrases:');
    console.log('   - "We need immediate qualified leads" → Paula');
    console.log('   - "We\'re missing calls after hours" → Alex');
    console.log('   - "We want to run Google Ads" → Peter');
    console.log('   - "We\'re a medical malpractice firm" → Patricia\n');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  }
}

// Run configuration
if (require.main === module) {
  configureSquad();
}

module.exports = { configureSquad, ASSISTANT_IDS };

