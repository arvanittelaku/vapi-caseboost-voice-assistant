#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

async function getSquads() {
  console.log('🔍 Fetching all squads...\n');

  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/squad`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const squads = response.data;

    if (!squads || squads.length === 0) {
      console.log('❌ No squads found!');
      return;
    }

    console.log(`✅ Found ${squads.length} squad(s):\n`);

    squads.forEach((squad, index) => {
      console.log(`Squad ${index + 1}:`);
      console.log(`   Name: ${squad.name || 'Unnamed'}`);
      console.log(`   ID: ${squad.id}`);
      console.log(`   Members: ${squad.members?.length || 0}`);
      
      if (squad.members && squad.members.length > 0) {
        console.log(`   Member IDs:`);
        squad.members.forEach((member, i) => {
          console.log(`     ${i + 1}. ${member.assistantId || member}`);
        });
      }
      
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error fetching squads:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

getSquads();

