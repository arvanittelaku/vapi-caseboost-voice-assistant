#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Sarah's Assistant ID
const SARAH_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

// Specialist IDs
const DESTINATIONS = {
  harper: '2c648dfc-3fb3-42db-8f33-93c1af214af5',
  patricia: '75610c62-79fb-4a4d-811e-da64bb211fd8',
  jordan: 'd705023c-eb4f-447c-bd55-77da2359f263',
  cameron: '83e9b907-1137-424c-8627-c3d283d3edbf',
  riley: '0157a988-7caa-4c7d-ab4f-012aab5daed9'
};

async function configureSarahWithDestinations() {
  console.log('🚀 Configuring Sarah with assistantDestinations...\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    // Step 1: Get current Sarah configuration
    console.log('📥 Fetching Sarah\'s current configuration...');
    const currentConfig = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    console.log('✅ Current config fetched\n');

    // Step 2: Update Sarah with assistantDestinations
    console.log('📝 Updating Sarah with assistantDestinations...');
    
    const updatePayload = {
      // Add assistantDestinations for transfers
      assistantDestinations: [
        {
          assistantId: DESTINATIONS.harper,
          message: "Let me connect you with Harper, our CaseBoost information specialist who can walk you through how we work. One moment please...",
          description: "Transfer to Harper for company info, how CaseBoost works, process explanations"
        },
        {
          assistantId: DESTINATIONS.patricia,
          message: "Perfect! Let me connect you with Patricia, our Practice Area consultant who specializes in understanding the unique needs of your practice area. One moment...",
          description: "Transfer to Patricia for practice area discussions and strategy"
        },
        {
          assistantId: DESTINATIONS.jordan,
          message: "Great question! Let me connect you with Jordan, our Service consultant who can explain all our services in detail and help you choose what fits best. Just a moment...",
          description: "Transfer to Jordan for services, SEO, PPC, AI intake, website, CRM, mass tort"
        },
        {
          assistantId: DESTINATIONS.riley,
          message: "I'd love for you to hear about our results! Let me connect you with Riley who has all our case studies and success stories. One moment...",
          description: "Transfer to Riley for case studies, testimonials, proof, results, ROI"
        },
        {
          assistantId: DESTINATIONS.cameron,
          message: "Excellent! Let me connect you with Cameron who can help you get started right away. They'll guide you through next steps. One moment please...",
          description: "Transfer to Cameron for booking consultation, buying leads, getting started"
        }
      ]
    };

    const response = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Sarah successfully configured with assistantDestinations!\n');
    console.log('📋 Configured Destinations:');
    console.log('   1. Harper (Company Info)');
    console.log('   2. Patricia (Practice Areas)');
    console.log('   3. Jordan (Services)');
    console.log('   4. Riley (Case Studies)');
    console.log('   5. Cameron (Transaction)\n');

    // Step 3: Verify the configuration
    console.log('🔍 Verifying configuration...');
    const verifyConfig = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    if (verifyConfig.data.assistantDestinations && verifyConfig.data.assistantDestinations.length > 0) {
      console.log('✅ VERIFIED - Sarah now has', verifyConfig.data.assistantDestinations.length, 'assistantDestinations configured\n');
      console.log('🎯 Transfer test phrases:');
      console.log('   - "How does CaseBoost work?" → Harper');
      console.log('   - "I\'m a medical malpractice lawyer" → Patricia');
      console.log('   - "Tell me about your SEO services" → Jordan');
      console.log('   - "Do you have case studies?" → Riley');
      console.log('   - "I want to get started" → Cameron\n');
      console.log('✨ Configuration complete! Ready for testing.\n');
    } else {
      console.error('⚠️  WARNING: assistantDestinations not found in verification');
    }

  } catch (error) {
    console.error('❌ Failed to configure Sarah:');
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
configureSarahWithDestinations();

