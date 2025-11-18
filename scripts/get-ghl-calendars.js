#!/usr/bin/env node

/**
 * Get GHL Calendars Script
 * 
 * Lists all calendars in your GoHighLevel location
 * to help you find the calendar ID for appointments
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

async function getCalendars() {
  try {
    console.log('🗓️  Fetching GoHighLevel Calendars...\n');
    
    const ghlClient = new GHLClient();
    
    // Get all calendars
    const calendars = await ghlClient.getCalendars();
    
    if (!calendars || calendars.length === 0) {
      console.log('❌ No calendars found in your GHL location.');
      console.log('\n💡 To create a calendar:');
      console.log('   1. Go to your GHL account');
      console.log('   2. Navigate to Calendars');
      console.log('   3. Click "Create Calendar"');
      console.log('   4. Name it "CaseBoost Consultations"');
      console.log('   5. Run this script again to get the ID');
      return;
    }
    
    console.log(`✅ Found ${calendars.length} calendar(s):\n`);
    
    calendars.forEach((calendar, index) => {
      console.log(`📅 Calendar #${index + 1}`);
      console.log(`   Name: ${calendar.name || 'Unnamed'}`);
      console.log(`   ID: ${calendar.id}`);
      console.log(`   Status: ${calendar.status || 'active'}`);
      console.log(`   Duration: ${calendar.slotDuration || 'N/A'} minutes`);
      console.log('');
    });
    
    console.log('─'.repeat(60));
    console.log('\n📝 NEXT STEPS:');
    console.log('\n1. Copy one of the calendar IDs above');
    console.log('2. Add it to your .env file:');
    console.log('');
    console.log(`   GOHIGHLEVEL_CALENDAR_ID=${calendars[0]?.id || 'your_calendar_id_here'}`);
    console.log('');
    console.log('3. The system will now create appointments in this calendar!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error fetching calendars:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication error. Please check:');
      console.log('   - GOHIGHLEVEL_API_KEY is correct');
      console.log('   - Your GHL account has API access (Pro plan required)');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Endpoint not found. This could mean:');
      console.log('   - The GHL API version might have changed');
      console.log('   - Calendar API might not be available for your account type');
    }
  }
}

// Run if called directly
if (require.main === module) {
  getCalendars();
}

module.exports = { getCalendars };

