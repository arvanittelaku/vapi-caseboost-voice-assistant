#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';
const CAPTURE_TOOL_ID = 'd095a079-8e11-46c8-b764-5f76272c7697';
const SEND_TOOL_ID = '73c76bdb-8d6d-4f7e-9688-5cd4be544573';

/**
 * Diagnose the tool configuration issue
 */
async function diagnoseTool(toolId, toolName) {
  try {
    console.log(`\n🔍 Diagnosing ${toolName}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const response = await axios.get(
      `${VAPI_BASE_URL}/tool/${toolId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    const tool = response.data;
    
    console.log('Tool ID:', tool.id);
    console.log('Tool Name:', tool.function?.name || 'N/A');
    console.log('Tool Type:', tool.type);
    console.log('Async:', tool.async);
    
    if (tool.type === 'function') {
      console.log('Function URL:', tool.server?.url || 'Not set (returns directly)');
    } else if (tool.type === 'output') {
      console.log('Webhook URL:', tool.server?.url || 'Not set');
    }
    
    console.log('\n📋 Parameters:');
    const props = tool.function?.parameters?.properties;
    
    if (props) {
      const propCount = Object.keys(props).length;
      console.log(`Total Properties: ${propCount}\n`);
      
      // Check first 5 properties for default values
      let index = 0;
      for (const [key, value] of Object.entries(props)) {
        if (index < 5) {
          console.log(`${index + 1}. ${key}:`);
          console.log(`   Type: ${value.type}`);
          console.log(`   Description: ${value.description || 'N/A'}`);
          
          if (value.default !== undefined) {
            console.log(`   ✅ Default: ${value.default}`);
          } else {
            console.log(`   ⚠️  Default: NOT SET`);
          }
          console.log('');
        }
        index++;
      }
      
      if (propCount > 5) {
        console.log(`... and ${propCount - 5} more properties\n`);
      }
      
      // Check if all defaults are the same (the bug)
      const defaults = Object.values(props)
        .filter(p => p.default !== undefined)
        .map(p => p.default);
      
      if (defaults.length > 0) {
        const uniqueDefaults = [...new Set(defaults)];
        console.log('📊 Default Value Analysis:');
        console.log(`   Total properties with defaults: ${defaults.length}`);
        console.log(`   Unique default values: ${uniqueDefaults.length}`);
        
        if (uniqueDefaults.length === 1 && defaults.length > 1) {
          console.log('\n   ❌ BUG DETECTED: All defaults have the same value!');
          console.log(`   All properties reference: ${uniqueDefaults[0]}`);
        } else if (uniqueDefaults.length === defaults.length) {
          console.log('\n   ✅ GOOD: Each property has unique default value');
        } else {
          console.log('\n   ⚠️  MIXED: Some properties share default values');
        }
      } else {
        console.log('⚠️  No default values set on any properties');
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return tool;

  } catch (error) {
    console.error(`❌ Error fetching ${toolName}:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 VAPI TOOL CONFIGURATION DIAGNOSTICS');
  console.log('═══════════════════════════════════════════════════════');

  if (!VAPI_API_KEY) {
    console.error('\n❌ VAPI_API_KEY not found in environment variables');
    process.exit(1);
  }

  // Diagnose both tools
  const captureTool = await diagnoseTool(CAPTURE_TOOL_ID, 'capture_qualification_data');
  const sendTool = await diagnoseTool(SEND_TOOL_ID, 'send_info_case_boost');

  // Summary
  console.log('\n📊 DIAGNOSIS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (captureTool) {
    console.log('✅ Tool 1 (capture_qualification_data):');
    console.log(`   Type: ${captureTool.type}`);
    console.log(`   Purpose: Captures data and returns it`);
    console.log(`   Status: ${captureTool.function ? 'Configured' : 'Missing config'}\n`);
  }

  if (sendTool) {
    console.log('✅ Tool 2 (send_info_case_boost):');
    console.log(`   Type: ${sendTool.type}`);
    console.log(`   Purpose: Sends data to GHL webhook`);
    console.log(`   Webhook: ${sendTool.server?.url ? 'Configured' : 'Missing'}\n`);
    
    const props = sendTool.function?.parameters?.properties;
    if (props) {
      const defaults = Object.values(props)
        .filter(p => p.default !== undefined)
        .map(p => p.default);
      
      const uniqueDefaults = [...new Set(defaults)];
      
      if (uniqueDefaults.length === 1 && defaults.length > 1) {
        console.log('   ❌ ISSUE: All properties have same default value');
        console.log('   ❌ This will cause all fields to send the same data');
        console.log(`   ❌ Current value: ${uniqueDefaults[0]}\n`);
        console.log('   🔧 FIX: Run node scripts/fix-send-tool-defaults.js\n');
      } else if (uniqueDefaults.length === defaults.length) {
        console.log('   ✅ GOOD: Each property has unique default\n');
      } else if (defaults.length === 0) {
        console.log('   ⚠️  WARNING: No default values set');
        console.log('   ⚠️  Sarah will need to manually pass ALL parameters\n');
        console.log('   🔧 FIX: Run node scripts/fix-send-tool-defaults.js\n');
      }
    }
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

main();

