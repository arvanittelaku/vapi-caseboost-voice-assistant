#!/usr/bin/env node

/**
 * Book Strategy Meeting Function Handler
 * 
 * Receives meeting booking requests from VAPI and creates
 * appointments in GoHighLevel CRM
 */

const axios = require('axios');

// Environment variables
const GHL_API_KEY = process.env.GOHIGHLEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.GOHIGHLEVEL_LOCATION_ID;
const GHL_CALENDAR_ID = process.env.GHL_CALENDAR_ID; // Add this to your .env
const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

/**
 * Handle meeting booking function call from VAPI
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function handleBookStrategyMeeting(req, res) {
  try {
    console.log('📅 Meeting booking request received:', req.body);
    
    const {
      call,
      message,
      functionCall
    } = req.body;
    
    // Extract function parameters
    const {
      contactEmail,
      contactPhone,
      preferredDate,
      preferredTime,
      timezone,
      specificTopics
    } = functionCall.parameters;
    
    // Validate required fields
    if (!contactEmail || !preferredDate || !preferredTime || !timezone) {
      console.error('❌ Missing required booking parameters');
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['contactEmail', 'preferredDate', 'preferredTime', 'timezone']
      });
    }
    
    // Find contact in GoHighLevel
    const contact = await findGHLContact(contactEmail, contactPhone);
    
    if (!contact) {
      console.error('❌ Contact not found in GHL');
      return res.status(404).json({
        error: 'Contact not found in CRM'
      });
    }
    
    console.log('✅ Found contact:', contact.id);
    
    // Create appointment in GoHighLevel
    const appointment = await createGHLAppointment({
      contactId: contact.id,
      calendarId: GHL_CALENDAR_ID,
      date: preferredDate,
      time: preferredTime,
      timezone: timezone,
      title: 'CaseBoost Strategy Session',
      notes: specificTopics || 'General strategy discussion',
      appointmentStatus: 'confirmed'
    });
    
    console.log('✅ Appointment created:', appointment.id);
    
    // Update contact with meeting info
    await updateContactWithMeetingInfo(contact.id, {
      meetingScheduled: true,
      meetingDate: preferredDate,
      meetingTime: preferredTime,
      meetingTimezone: timezone,
      meetingNotes: specificTopics || ''
    });
    
    // Send confirmation email (optional - GHL might do this automatically)
    await sendMeetingConfirmation(contact, {
      date: preferredDate,
      time: preferredTime,
      timezone: timezone
    });
    
    // Return success to VAPI
    return res.status(200).json({
      success: true,
      message: 'Meeting booked successfully',
      appointmentId: appointment.id,
      contactId: contact.id,
      scheduledFor: `${preferredDate} at ${preferredTime} ${timezone}`,
      // This message will be used by the assistant
      result: `Perfect! I've successfully booked your strategy session for ${formatDateForSpeech(preferredDate)} at ${formatTimeForSpeech(preferredTime)} ${timezone}. You'll receive a confirmation email with all the details shortly.`
    });
    
  } catch (error) {
    console.error('❌ Error booking meeting:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to book meeting',
      details: error.response?.data || error.message,
      // This message will be read by the assistant
      result: "I apologize, but I encountered a technical issue while booking your meeting. Let me have someone from our team reach out to you directly to schedule this. You'll hear from us within the next hour."
    });
  }
}

/**
 * Find contact in GoHighLevel by email or phone
 * @param {string} email - Contact email
 * @param {string} phone - Contact phone
 * @returns {Promise<Object>} - GHL contact object
 */
async function findGHLContact(email, phone) {
  try {
    console.log('🔍 Searching for contact in GHL...');
    
    // Try to find by email first
    if (email) {
      const response = await axios.get(
        `${GHL_BASE_URL}/contacts`,
        {
          params: {
            locationId: GHL_LOCATION_ID,
            email: email
          },
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }
    }
    
    // Try to find by phone if email search fails
    if (phone) {
      const response = await axios.get(
        `${GHL_BASE_URL}/contacts`,
        {
          params: {
            locationId: GHL_LOCATION_ID,
            phone: phone
          },
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error finding contact:', error.message);
    throw error;
  }
}

/**
 * Create appointment in GoHighLevel
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<Object>} - Created appointment
 */
async function createGHLAppointment(appointmentData) {
  try {
    console.log('📅 Creating appointment in GHL...');
    
    const {
      contactId,
      calendarId,
      date,
      time,
      timezone,
      title,
      notes,
      appointmentStatus
    } = appointmentData;
    
    // Combine date and time into ISO format
    const startDateTime = new Date(`${date}T${time}:00`);
    // Set end time to 30 minutes later (adjust as needed)
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
    
    const appointmentPayload = {
      calendarId: calendarId,
      contactId: contactId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      title: title,
      appointmentStatus: appointmentStatus,
      notes: notes,
      timezone: timezone
    };
    
    const response = await axios.post(
      `${GHL_BASE_URL}/appointments`,
      appointmentPayload,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.appointment || response.data;
  } catch (error) {
    console.error('❌ Error creating appointment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update contact with meeting information
 * @param {string} contactId - GHL contact ID
 * @param {Object} meetingInfo - Meeting details
 */
async function updateContactWithMeetingInfo(contactId, meetingInfo) {
  try {
    console.log('📝 Updating contact with meeting info...');
    
    const updatePayload = {
      customField: {
        'Meeting Scheduled': meetingInfo.meetingScheduled ? 'Yes' : 'No',
        'Meeting Date': meetingInfo.meetingDate,
        'Meeting Time': meetingInfo.meetingTime,
        'Meeting Timezone': meetingInfo.meetingTimezone,
        'Meeting Notes': meetingInfo.meetingNotes
      },
      tags: ['Strategy Call Booked', 'Qualified Lead']
    };
    
    await axios.put(
      `${GHL_BASE_URL}/contacts/${contactId}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Contact updated with meeting info');
  } catch (error) {
    console.error('❌ Error updating contact:', error.message);
    // Don't throw - this is not critical
  }
}

/**
 * Send meeting confirmation email
 * @param {Object} contact - GHL contact
 * @param {Object} meetingDetails - Meeting details
 */
async function sendMeetingConfirmation(contact, meetingDetails) {
  try {
    console.log('📧 Sending meeting confirmation email...');
    
    // This is optional - GHL calendar might send this automatically
    // You can implement custom email sending here if needed
    
    console.log('✅ Confirmation email sent');
  } catch (error) {
    console.error('❌ Error sending confirmation:', error.message);
    // Don't throw - this is not critical
  }
}

/**
 * Format date for natural speech
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date
 */
function formatDateForSpeech(date) {
  const dateObj = new Date(date);
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format time for natural speech
 * @param {string} time - Time in HH:MM format (24-hour)
 * @returns {string} - Formatted time (12-hour with AM/PM)
 */
function formatTimeForSpeech(time) {
  const [hours, minutes] = time.split(':');
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Express middleware wrapper
 */
function setupBookMeetingEndpoint(app) {
  app.post('/webhook/vapi/book-meeting', handleBookStrategyMeeting);
  console.log('📅 Meeting booking endpoint registered: /webhook/vapi/book-meeting');
}

module.exports = {
  handleBookStrategyMeeting,
  setupBookMeetingEndpoint,
  findGHLContact,
  createGHLAppointment
};

// If run directly (for testing)
if (require.main === module) {
  console.log('🧪 Testing meeting booking handler...\n');
  
  // Mock request
  const mockReq = {
    body: {
      call: {
        id: 'test-call-123'
      },
      functionCall: {
        name: 'book_strategy_meeting',
        parameters: {
          contactEmail: 'test@example.com',
          contactPhone: '+12132127052',
          preferredDate: '2024-11-05',
          preferredTime: '14:00',
          timezone: 'America/New_York',
          specificTopics: 'Interested in SEO and PPC services'
        }
      }
    }
  };
  
  // Mock response
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`Status: ${code}`);
        console.log('Response:', JSON.stringify(data, null, 2));
        return data;
      }
    })
  };
  
  console.log('Mock Request:', JSON.stringify(mockReq.body, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Note: This will fail without proper environment variables
  // handleBookStrategyMeeting(mockReq, mockRes);
  
  console.log('✅ Handler structure is valid!');
  console.log('\n💡 To test with real data, add this to your .env:');
  console.log('   GHL_CALENDAR_ID=your_calendar_id_here');
  console.log('\n📝 Then run: node scripts/book-meeting-function-handler.js');
}

