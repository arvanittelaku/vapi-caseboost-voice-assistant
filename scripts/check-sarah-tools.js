#!/usr/bin/env node

// Load .env from project root (parent directory)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const SARAH_ID = '87bbafd3-e24d-4de6-ac76-9ec93d180571';

async function checkSarahTools() {
  console.log('🔍 Checking Sarah\'s Configuration...\n');

  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/assistant/${SARAH_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sarah = response.data;

    console.log('✅ Sarah\'s Configuration:\n');
    console.log(`Name: ${sarah.name}`);
    console.log(`ID: ${sarah.id}`);
    console.log(`\n📋 Tools:`);
    
    // VAPI stores tools as IDs in model.toolIds
    const toolIds = sarah.model?.toolIds || [];
    
    if (toolIds.length > 0) {
      console.log(`   ✅ Found ${toolIds.length} tool ID(s):`);
      toolIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
      
      // Try to fetch tool details for each ID
      console.log(`\n   📋 Fetching tool details...`);
      const toolDetails = [];
      
      for (const toolId of toolIds) {
        try {
          const toolResponse = await axios.get(
            `${VAPI_BASE_URL}/tool/${toolId}`,
            {
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          toolDetails.push(toolResponse.data);
        } catch (error) {
          console.log(`   ⚠️  Could not fetch tool ${toolId}: ${error.message}`);
        }
      }
      
      if (toolDetails.length > 0) {
        console.log(`\n   ✅ Tool Details:`);
        toolDetails.forEach((tool, index) => {
          console.log(`\n   Tool ${index + 1}:`);
          console.log(`   - ID: ${tool.id}`);
          console.log(`   - Type: ${tool.type || 'N/A'}`);
          console.log(`   - Name: ${tool.name || 'N/A'}`);
          
          if (tool.type === 'handoff' || tool.type === 'transferCall') {
            console.log(`   - Destinations: ${tool.destinations?.length || 0}`);
            if (tool.destinations && tool.destinations.length > 0) {
              tool.destinations.forEach((dest, i) => {
                console.log(`     ${i + 1}. ${dest.assistantName || dest.assistant || 'N/A'}`);
              });
            }
          }
          
          if (tool.type === 'function') {
            console.log(`   - Function Name: ${tool.function?.name || 'N/A'}`);
            console.log(`   - Server URL: ${tool.serverUrl || 'N/A'}`);
          }
        });
      }
    } else {
      console.log('   ❌ NO TOOL IDs FOUND!');
    }

    console.log('\n\n🎯 DIAGNOSIS:');
    
    if (toolIds.length === 0) {
      console.log('❌ PROBLEM FOUND: Sarah has NO tools attached!');
      console.log('\n📋 SOLUTION:');
      console.log('1. Go to VAPI Dashboard → Assistants → Sarah');
      console.log('2. Scroll to "Tools" section');
      console.log('3. Add required tools:');
      console.log('   - Calendar availability tool (function)');
      console.log('   - Calendar booking tool (function)');
      console.log('   - Handoff tool (transferCall) with 5 destinations');
      console.log('4. Save the assistant');
    } else if (toolDetails.length === 0) {
      console.log('⚠️  WARNING: Could not fetch tool details');
      console.log('   But tools are attached (IDs found)');
      console.log(`   Found ${toolIds.length} tool ID(s)`);
    } else {
      const handoffTools = toolDetails.filter(t => t.type === 'handoff' || t.type === 'transferCall');
      const functionTools = toolDetails.filter(t => t.type === 'function');
      
      if (handoffTools.length === 0) {
        console.log('⚠️  WARNING: No handoff/transfer tools found!');
        console.log('   Sarah needs a handoff tool to transfer to specialists.');
      } else {
        const handoffTool = handoffTools[0];
        if (!handoffTool.destinations || handoffTool.destinations.length === 0) {
          console.log('❌ PROBLEM: Handoff tool has NO destinations!');
        } else if (handoffTool.destinations.length < 5) {
          console.log(`⚠️  WARNING: Handoff tool has ${handoffTool.destinations.length} destinations (should be 5)`);
        } else {
          console.log('✅ Handoff tool configured with all destinations!');
        }
      }
      
      if (functionTools.length === 0) {
        console.log('⚠️  WARNING: No function tools found!');
        console.log('   Sarah needs calendar tools (check_availability, book_appointment)');
      } else {
        const calendarTools = functionTools.filter(t => 
          t.function?.name?.includes('calendar') || 
          t.function?.name?.includes('availability') ||
          t.function?.name?.includes('appointment')
        );
        if (calendarTools.length === 0) {
          console.log('⚠️  WARNING: No calendar tools found!');
        } else {
          console.log(`✅ Found ${calendarTools.length} calendar tool(s)!`);
          calendarTools.forEach(tool => {
            console.log(`   - ${tool.function?.name || 'Unknown'}`);
          });
        }
      }
    }

    console.log('\n\n📄 FULL RESPONSE (for debugging):');
    console.log(JSON.stringify(sarah, null, 2));

  } catch (error) {
    console.error('❌ Error fetching Sarah\'s config:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

checkSarahTools();

