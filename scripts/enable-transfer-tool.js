const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

const SARAH_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

const transferTool = {
  type: 'transferCall',
  destinations: [
    {
      type: 'assistant',
      assistantName: 'Harper',
      assistantId: '2c648dfc-3fb3-42db-8f33-93c1af214af5',
      description: 'Information Specialist - How It Works, Company Info'
    },
    {
      type: 'assistant',
      assistantName: 'Patricia',
      assistantId: '75610c62-79fb-4a4d-811e-da64bb211fd8',
      description: 'Practice Area Specialist'
    },
    {
      type: 'assistant',
      assistantName: 'Jordan',
      assistantId: 'd705023c-eb4f-447c-bd55-77da2359f263',
      description: 'Service Consultant - All 7 Services'
    },
    {
      type: 'assistant',
      assistantName: 'Cameron',
      assistantId: '83e9b907-1137-424c-8627-c3d283d3edbf',
      description: 'Transaction Specialist - Buy Leads, Booking'
    },
    {
      type: 'assistant',
      assistantName: 'Riley',
      assistantId: '0157a988-7caa-4c7d-ab4f-012aab5daed9',
      description: 'Social Proof Specialist - Results, Case Studies'
    }
  ]
};

async function enableTransferTool() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔧 ENABLING TRANSFER TOOL FOR SARAH');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    console.log('📋 Step 1: Fetching Sarah\'s current configuration...\n');
    
    const getResponse = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const currentConfig = getResponse.data;
    const currentTools = currentConfig.tools || [];

    console.log(`✅ Current configuration retrieved`);
    console.log(`   Existing tools: ${currentTools.length}\n`);

    console.log('🔧 Step 2: Adding transferCall tool...\n');

    // Add transfer tool to existing tools (remove old one if exists)
    const updatedTools = [
      ...currentTools.filter(t => t.type !== 'transferCall'),
      transferTool
    ];

    console.log('📤 Step 3: Updating Sarah with transfer tool...\n');
    
    const updateResponse = await axios.patch(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      {
        tools: updatedTools
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ TRANSFER TOOL ENABLED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Transfer Destinations Configured:\n');
    console.log('   1. Harper (Information Specialist)');
    console.log('      → How It Works, Company Info');
    console.log('      → ID: 2c648dfc-3fb3-42db-8f33-93c1af214af5\n');
    
    console.log('   2. Patricia (Practice Area Specialist)');
    console.log('      → Medical Malpractice, Personal Injury, etc.');
    console.log('      → ID: 75610c62-79fb-4a4d-811e-da64bb211fd8\n');
    
    console.log('   3. Jordan (Service Consultant)');
    console.log('      → SEO, PPC, AI Intake, Website, CRM, Mass Tort');
    console.log('      → ID: d705023c-eb4f-447c-bd55-77da2359f263\n');
    
    console.log('   4. Cameron (Transaction Specialist)');
    console.log('      → Buy Leads, Book Consultation');
    console.log('      → ID: 83e9b907-1137-424c-8627-c3d283d3edbf\n');
    
    console.log('   5. Riley (Social Proof Specialist)');
    console.log('      → Case Studies, Results, Testimonials');
    console.log('      → ID: 0157a988-7caa-4c7d-ab4f-012aab5daed9\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🧪 NEXT STEP: Test the transfer functionality!\n');
    console.log('   Run: node scripts/test-squad-transfer.js\n');
    console.log('   Say: "I need SEO services"\n');
    console.log('   Expected: Voice changes from Sarah to Jordan\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Failed to enable transfer tool:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 400) {
        console.log('\n💡 POSSIBLE CAUSES:');
        console.log('   1. Transfer tool format incorrect');
        console.log('   2. Destinations not supported');
        console.log('   3. Feature not enabled for account\n');
        console.log('📧 SOLUTION: Contact VAPI support (support@vapi.ai)');
        console.log('   Subject: Enable Assistant-to-Assistant Transfers');
        console.log('   Include: Squad ID d84cc64f-e67b-4020-8204-8a1cfdacd1f6\n');
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

enableTransferTool();

