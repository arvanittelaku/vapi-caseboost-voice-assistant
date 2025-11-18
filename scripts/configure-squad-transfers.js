#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Squad ID
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacd1f6';

// Assistant IDs
const ASSISTANTS = {
  sarah: '87bbafd3-e24d-4de6-ac76-9ec93d180571',
  harper: '2c648dfc-3fb3-42db-8f33-93c1af214af5',
  patricia: '75610c62-79fb-4a4d-811e-da64bb211fd8',
  jordan: 'd705023c-eb4f-447c-bd55-77da2359f263',
  cameron: '83e9b907-1137-424c-8627-c3d283d3edbf',
  riley: '0157a988-7caa-4c7d-ab4f-012aab5daed9'
};

async function configureSquadTransfers() {
  console.log('🚀 Configuring Squad with transfer members...\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    // Step 1: Configure squad with members
    console.log('📝 Configuring squad members and transfer rules...');
    
    const squadConfig = {
      members: [
        { assistantId: ASSISTANTS.sarah },
        { assistantId: ASSISTANTS.harper },
        { assistantId: ASSISTANTS.patricia },
        { assistantId: ASSISTANTS.jordan },
        { assistantId: ASSISTANTS.riley },
        { assistantId: ASSISTANTS.cameron }
      ]
    };

    const response = await axios.patch(
      `${VAPI_BASE_URL}/squads/${SQUAD_ID}`,
      squadConfig,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Squad configured successfully!\n');
    console.log('📋 Squad Members:');
    console.log('   1. Sarah (Main Router)');
    console.log('   2. Harper (Company Info)');
    console.log('   3. Patricia (Practice Areas)');
    console.log('   4. Jordan (Services)');
    console.log('   5. Riley (Case Studies)');
    console.log('   6. Cameron (Transaction)\n');

    // Step 2: Verify the configuration
    console.log('🔍 Verifying squad configuration...');
    const verifyConfig = await axios.get(
      `${VAPI_BASE_URL}/squads/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    if (verifyConfig.data.members && verifyConfig.data.members.length > 0) {
      console.log('✅ VERIFIED - Squad now has', verifyConfig.data.members.length, 'members configured\n');
      console.log('🎯 How transfers work:');
      console.log('   - Sarah\'s system prompt includes transfer instructions');
      console.log('   - When Sarah detects keywords, she uses built-in transfer function');
      console.log('   - VAPI automatically routes to the correct assistant in the squad');
      console.log('   - Context is preserved via rolling-history (enabled by default)\n');
      console.log('✨ Configuration complete! Ready for testing.\n');
      console.log('📞 Test phrases:');
      console.log('   - "How does CaseBoost work?" → Harper');
      console.log('   - "I\'m a medical malpractice lawyer" → Patricia');
      console.log('   - "Tell me about your SEO services" → Jordan');
      console.log('   - "Do you have case studies?" → Riley');
      console.log('   - "I want to get started" → Cameron\n');
    } else {
      console.error('⚠️  WARNING: Members not found in verification');
    }

  } catch (error) {
    console.error('❌ Failed to configure squad:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the configuration
configureSquadTransfers();

