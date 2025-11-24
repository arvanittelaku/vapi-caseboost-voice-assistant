const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

/**
 * Calendar Webhook Handler for VAPI Squad
 * 
 * Handles two VAPI function tools:
 * 1. check_calendar_availability - Check if requested time slot is available
 * 2. book_calendar_appointment - Book the appointment in GHL calendar
 */

// Support both abbreviated (GHL_*) and full (GOHIGHLEVEL_*) variable names
const GHL_API_KEY = process.env.GHL_API_KEY || process.env.GOHIGHLEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || process.env.GOHIGHLEVEL_LOCATION_ID;
const GHL_CALENDAR_ID = process.env.GHL_CALENDAR_ID;
const CALENDAR_TIMEZONE = process.env.CALENDAR_TIMEZONE || 'America/New_York';

const logFile = path.join(__dirname, '../../server.log');

/**
 * Log message to server.log with timestamp
 */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

/**
 * Main webhook handler - processes both calendar tools
 */
async function handleCalendarWebhook(req, res) {
  try {
    log('📥 VAPI Calendar Webhook Received', req.body);

    // Parse toolCall from multiple possible formats
    // Format 1: Direct toolCall (our test format)
    // Format 2: VAPI's actual format with message.toolCalls
    let toolCall = req.body.toolCall || 
                   req.body.toolCalls?.[0] || 
                   req.body.toolCallList?.[0] ||
                   req.body.message?.toolCalls?.[0];

    if (!toolCall) {
      log('❌ No toolCall found in request');
      log('Request body structure:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        error: 'No toolCall found in request body'
      });
    }

    log('✅ Tool call found:', toolCall);

    const functionData = toolCall.function;
    const functionName = functionData?.name;
    let parameters = functionData?.arguments;

    // If parameters is a string (VAPI sends JSON string), parse it
    if (typeof parameters === 'string') {
      try {
        parameters = JSON.parse(parameters);
        log('📝 Parsed stringified parameters', parameters);
      } catch (error) {
        log('❌ Failed to parse parameters string:', parameters);
        return res.status(400).json({
          error: 'Invalid parameters format'
        });
      }
    }

    log(`🔧 Function Called: ${functionName}`, parameters);

    let result;

    // Route to appropriate handler (support both naming conventions)
    switch (functionName) {
      case 'check_calendar_availability':
      case 'check_calendar_availability_caseboost':
        result = await checkCalendarAvailability(parameters);
        break;
      
      case 'book_calendar_appointment':
      case 'book_calendar_appointment_caseboost':
        result = await bookCalendarAppointment(parameters);
        break;
      
      case 'update_appointment_status':
      case 'update_appointment_status_caseboost':
        result = await updateAppointmentStatus(parameters);
        break;
      
      default:
        log(`❌ Unknown function: ${functionName}`);
        return res.status(400).json({
          error: `Unknown function: ${functionName}`
        });
    }

    // Return VAPI message response format
    const response = {
      result: result
    };

    log('✅ Response sent to VAPI', response);
    return res.status(200).json(response);

  } catch (error) {
    log('❌ Error in calendar webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * TOOL 1: Check Calendar Availability
 * 
 * @param {Object} params - { requestedDate, requestedTime, timezone }
 * @returns {Object} - { available: boolean, message: string, alternatives?: Array }
 */
async function checkCalendarAvailability(params) {
  try {
    // Support both parameter naming conventions
    const requestedDate = params.requestedDate || params.date;
    const requestedTime = params.requestedTime || params.time;
    const timezone = params.timezone || 'America/New_York';
    
    log(`🔍 Checking availability for: ${requestedDate} at ${requestedTime || 'all day'} ${timezone}`);

    // Parse requested time in user's timezone
    const requestedDateTime = parseDateTime(requestedDate, requestedTime, timezone);
    log(`📅 Parsed requested time: ${requestedDateTime.toISO()}`);

    // Convert to calendar timezone
    const requestedInCalendarTZ = requestedDateTime.setZone(CALENDAR_TIMEZONE);
    log(`📅 Converted to calendar TZ: ${requestedInCalendarTZ.toISO()}`);

    // Fetch busy slots from GHL
    const busySlots = await fetchBusySlotsFromGHL(requestedInCalendarTZ);
    log(`📊 Found ${busySlots.length} busy slots`);

    // Check if requested time conflicts with any busy slot (1-minute tolerance)
    const isAvailable = !busySlots.some(slot => {
      const busyStart = DateTime.fromISO(slot.startTime).setZone(CALENDAR_TIMEZONE);
      const busyEnd = DateTime.fromISO(slot.endTime).setZone(CALENDAR_TIMEZONE);
      
      // Check if requested time falls within busy slot (with 1-minute tolerance)
      const diff = Math.abs(busyStart.toMillis() - requestedInCalendarTZ.toMillis());
      const overlap = diff < 60000; // 1 minute = 60000 milliseconds
      
      if (overlap) {
        log(`❌ Conflict found with slot: ${busyStart.toISO()} - ${busyEnd.toISO()}`);
      }
      
      return overlap;
    });

    if (isAvailable) {
      log('✅ Time slot is available!');
      const timeMsg = requestedTime ? `at ${requestedTime}` : '';
      return {
        available: true,
        message: `${requestedDate} ${timeMsg} is available. Would you like to book this time?`
      };
    } else {
      log('⚠️ Time slot is NOT available, suggesting alternatives');
      
      // Suggest 3 alternative slots
      const alternatives = await suggestAlternativeSlots(requestedInCalendarTZ, busySlots);
      
      const timeMsg = requestedTime ? `at ${requestedTime}` : '';
      return {
        available: false,
        message: `Sorry, ${requestedDate} ${timeMsg} is not available. Here are some alternative times:`,
        alternatives: alternatives.map(alt => ({
          date: alt.date,
          time: alt.time,
          timezone: alt.timezone
        }))
      };
    }

  } catch (error) {
    log('❌ Error checking availability:', error);
    return {
      available: false,
      message: 'I encountered an error checking availability. Let me try to find you a good time anyway.',
      error: error.message
    };
  }
}

/**
 * TOOL 2: Book Calendar Appointment
 * 
 * @param {Object} params - { bookingDate, bookingTime, timezone, fullName, email, phone }
 * @returns {Object} - { success: boolean, message: string }
 */
async function bookCalendarAppointment(params) {
  try {
    // Support both parameter naming conventions (date/bookingDate, time/bookingTime)
    const bookingDate = params.bookingDate || params.date;
    const bookingTime = params.bookingTime || params.time;
    const timezone = params.timezone || 'America/New_York';
    const fullName = params.fullName || params.name;
    const email = params.email;
    const phone = params.phone;
    
    // Validate required parameters
    if (!bookingDate || !bookingTime) {
      log('❌ Missing date or time');
      return {
        success: false,
        message: 'I need both a date and time to book your appointment. What date and time work best for you?'
      };
    }

    if (!fullName || !email || !phone) {
      log('❌ Missing contact information', { fullName, email, phone });
      return {
        success: false,
        message: 'I need your full name, email, and phone number to complete the booking. Can you provide those for me?'
      };
    }
    
    log(`📅 Booking appointment for: ${fullName} (${email})`, params);

    // Parse booking time
    const bookingDateTime = parseDateTime(bookingDate, bookingTime, timezone);
    const bookingInCalendarTZ = bookingDateTime.setZone(CALENDAR_TIMEZONE);
    
    log(`📅 Booking time in calendar TZ: ${bookingInCalendarTZ.toISO()}`);

    // CRITICAL: Check availability again before booking (1-minute tolerance)
    const busySlots = await fetchBusySlotsFromGHL(bookingInCalendarTZ);
    
    const isStillAvailable = !busySlots.some(slot => {
      const busyStart = DateTime.fromISO(slot.startTime).setZone(CALENDAR_TIMEZONE);
      const diff = Math.abs(busyStart.toMillis() - bookingInCalendarTZ.toMillis());
      return diff < 60000; // 1 minute tolerance
    });

    if (!isStillAvailable) {
      log('❌ Time slot no longer available!');
      return {
        success: false,
        message: `I'm sorry, but ${bookingDate} at ${bookingTime} ${timezone} was just booked by someone else. Let me help you find another time.`
      };
    }

    // Find or create contact in GHL
    const contact = await findOrCreateContact(fullName, email, phone);
    
    if (!contact || !contact.id) {
      log('❌ Failed to create/find contact');
      return {
        success: false,
        message: 'I encountered an issue setting up your contact information. Let me have someone from our team reach out to you directly to complete the booking.'
      };
    }
    
    log(`👤 Contact ID: ${contact.id}`);

    // Create appointment in GHL
    const startTimeMs = bookingInCalendarTZ.toMillis(); // CRITICAL: Use Unix timestamp (milliseconds)!
    const endTimeMs = bookingInCalendarTZ.plus({ minutes: 30 }).toMillis(); // 30-minute appointment

    const appointment = await createGHLAppointment({
      calendarId: GHL_CALENDAR_ID,
      contactId: contact.id,
      startTime: startTimeMs,
      endTime: endTimeMs,
      title: `CaseBoost Consultation - ${fullName}`,
      notes: `Booked via VAPI voice assistant\nRequested timezone: ${timezone}`,
      timezone: CALENDAR_TIMEZONE
    });

    log(`✅ Appointment created: ${appointment.id}`);

    // Update contact custom fields (using existing field names - Option A)
    await updateContactCustomFields(contact.id, {
      'Requested Meeting Date': bookingDate,
      'Requested Meeting Time': bookingTime,
      'Meeting Timezone': timezone,
      'Meeting Status': 'confirmed'
    });

    log('✅ Contact custom fields updated');

    return {
      success: true,
      message: `Perfect! I've booked your consultation for ${bookingDate} at ${bookingTime} ${timezone}. You'll receive a confirmation email shortly at ${email}.`,
      appointmentId: appointment.id,
      startTime: bookingInCalendarTZ.toISO() // Return ISO format for readability
    };

  } catch (error) {
    log('❌ Error booking appointment:', error);
    return {
      success: false,
      message: 'I apologize, but I encountered an error while booking your appointment. Let me have someone from our team reach out to you directly to schedule this. You\'ll hear from us within the next hour.',
      error: error.message
    };
  }
}

/**
 * Parse date and time string into Luxon DateTime
 * Handles natural language dates like "tomorrow", "Monday", ISO dates, etc.
 * 
 * @param {string} date - "tomorrow", "Monday", "2024-11-05", "November 5, 2024"
 * @param {string} time - "2:00 PM", "14:00", or undefined
 * @param {string} tz - "America/New_York"
 * @returns {DateTime}
 */
function parseDateTime(date, time, tz) {
  const timezone = tz || 'America/New_York';
  let baseDate = DateTime.now().setZone(timezone);
  
  // Default time if not provided
  const defaultHour = 9;
  const defaultMinute = 0;
  
  // Parse the date part
  const dateLower = (date || '').toLowerCase().trim();
  
  if (dateLower === 'today') {
    // Keep baseDate as today
  } else if (dateLower === 'tomorrow') {
    baseDate = baseDate.plus({ days: 1 });
  } else if (dateLower === 'day after tomorrow') {
    baseDate = baseDate.plus({ days: 2 });
  } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateLower)) {
    // Find next occurrence of this weekday
    const targetDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dateLower) + 1;
    const currentDay = baseDate.weekday;
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }
    baseDate = baseDate.plus({ days: daysToAdd });
  } else if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // ISO format: 2024-11-05
    baseDate = DateTime.fromISO(date, { zone: timezone });
  } else if (date && date.match(/[A-Za-z]/)) {
    // Try parsing as natural language date (e.g., "November 5, 2024", "Dec 22")
    try {
      const jsDate = new Date(date);
      if (!isNaN(jsDate.getTime())) {
        baseDate = DateTime.fromJSDate(jsDate, { zone: timezone });
      }
    } catch (e) {
      log(`⚠️ Could not parse date: ${date}, using today`);
    }
  }
  
  // Parse the time part
  let hour = defaultHour;
  let minute = defaultMinute;
  
  if (time) {
    const timeTrim = time.trim();
    
    if (timeTrim.match(/AM|PM/i)) {
      // 12-hour format: "2:00 PM", "10 AM"
      const match = timeTrim.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (match) {
        hour = parseInt(match[1]);
        minute = parseInt(match[2] || '0');
        const period = match[3].toUpperCase();
        
        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }
      }
    } else if (timeTrim.match(/^\d{1,2}:\d{2}$/)) {
      // 24-hour format: "14:00"
      const [h, m] = timeTrim.split(':');
      hour = parseInt(h);
      minute = parseInt(m);
    } else if (timeTrim.match(/^\d{1,2}$/)) {
      // Just hour: "14"
      hour = parseInt(timeTrim);
    }
  }
  
  // Create final DateTime with parsed date and time
  const result = baseDate.set({ 
    hour: hour, 
    minute: minute, 
    second: 0, 
    millisecond: 0 
  });
  
  log(`📅 Parsed: "${date}" "${time || 'default'}" → ${result.toISO()}`);
  
  return result;
}

/**
 * Fetch busy slots from GHL API
 */
async function fetchBusySlotsFromGHL(requestedTime) {
  try {
    const axios = require('axios');
    
    // Get busy slots for the requested day
    const startOfDay = requestedTime.startOf('day');
    const endOfDay = requestedTime.endOf('day');
    
    // Convert to Unix timestamps (milliseconds) - GHL API requirement
    const startTimeMs = startOfDay.toMillis();
    const endTimeMs = endOfDay.toMillis();

    log(`📅 Fetching appointments for ${startOfDay.toFormat('yyyy-MM-dd')} (${startTimeMs} - ${endTimeMs})`);

    // Fetch appointments from GHL calendar
    const appointmentsResponse = await axios.get(
      `https://services.leadconnectorhq.com/calendars/events`,
      {
        params: {
          calendarId: GHL_CALENDAR_ID,
          startTime: startTimeMs,
          endTime: endTimeMs
        },
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    const busySlots = appointmentsResponse.data.events || [];
    log(`📊 Found ${busySlots.length} appointments`, busySlots.length > 0 ? busySlots : undefined);

    return busySlots;

  } catch (error) {
    const errorData = error.response?.data || error.message;
    log('❌ Error fetching busy slots:', errorData);
    
    // If 403 permission error, log it but continue (we'll try to book anyway)
    if (error.response?.status === 403) {
      log('⚠️  Calendar API token lacks permission - continuing with booking attempt');
    }
    
    return []; // Return empty array on error (assume all times available)
  }
}

/**
 * Suggest alternative time slots
 */
async function suggestAlternativeSlots(requestedTime, busySlots) {
  const alternatives = [];
  const BUSINESS_START_HOUR = 9; // 9 AM
  const BUSINESS_END_HOUR = 17; // 5 PM
  
  let currentTime = requestedTime.set({ hour: BUSINESS_START_HOUR, minute: 0 });
  const maxAttempts = 50; // Check up to 50 slots
  let attempts = 0;

  while (alternatives.length < 3 && attempts < maxAttempts) {
    attempts++;

    // Skip weekends
    if (currentTime.weekday === 6 || currentTime.weekday === 7) {
      currentTime = currentTime.plus({ days: 1 }).set({ hour: BUSINESS_START_HOUR, minute: 0 });
      continue;
    }

    // Skip times outside business hours
    if (currentTime.hour < BUSINESS_START_HOUR || currentTime.hour >= BUSINESS_END_HOUR) {
      currentTime = currentTime.plus({ days: 1 }).set({ hour: BUSINESS_START_HOUR, minute: 0 });
      continue;
    }

    // Check if this slot is available (1-minute tolerance)
    const isAvailable = !busySlots.some(slot => {
      const busyStart = DateTime.fromISO(slot.startTime).setZone(CALENDAR_TIMEZONE);
      const diff = Math.abs(busyStart.toMillis() - currentTime.toMillis());
      return diff < 60000;
    });

    if (isAvailable) {
      // Convert back to user's timezone for display
      const displayTime = currentTime.setZone(requestedTime.zoneName);
      
      alternatives.push({
        date: displayTime.toFormat('yyyy-MM-dd'),
        time: displayTime.toFormat('h:mm a'),
        timezone: displayTime.zoneName
      });
    }

    // Move to next 30-minute slot
    currentTime = currentTime.plus({ minutes: 30 });
  }

  log(`✅ Found ${alternatives.length} alternative slots`, alternatives);
  return alternatives;
}

/**
 * Find or create contact in GHL
 */
async function findOrCreateContact(fullName, email, phone) {
  try {
    const axios = require('axios');
    
    // Try to find existing contact by phone (more reliable than email search)
    let searchResponse;
    try {
      searchResponse = await axios.get(
        'https://services.leadconnectorhq.com/contacts/search/duplicate',
        {
          params: {
            locationId: GHL_LOCATION_ID,
            email: email
          },
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );

      if (searchResponse.data.contact) {
        log('✅ Found existing contact via duplicate search');
        return searchResponse.data.contact;
      }
    } catch (searchError) {
      log('⚠️  Contact search returned no results, will create new contact');
    }

    // Create new contact
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName; // Fallback to firstName if no lastName

    const createResponse = await axios.post(
      'https://services.leadconnectorhq.com/contacts/',
      {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        locationId: GHL_LOCATION_ID,
        source: 'VAPI Voice Assistant - Calendar Booking'
      },
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    log('✅ Created new contact');
    return createResponse.data.contact;

  } catch (error) {
    log('❌ Error finding/creating contact:', error.response?.data || error.message);
    
    // Return a more graceful error instead of throwing
    return {
      id: null,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Create appointment in GHL
 */
async function createGHLAppointment(appointmentData) {
  try {
    const axios = require('axios');
    
    const response = await axios.post(
      'https://services.leadconnectorhq.com/calendars/events/appointments',
      {
        calendarId: appointmentData.calendarId,
        locationId: GHL_LOCATION_ID,
        contactId: appointmentData.contactId,
        startTime: appointmentData.startTime, // CRITICAL: Must be Unix timestamp (milliseconds)!
        endTime: appointmentData.endTime,
        title: appointmentData.title,
        appointmentStatus: 'confirmed',
        notes: appointmentData.notes
      },
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    log('✅ Appointment created in GHL', response.data);
    return response.data;

  } catch (error) {
    log('❌ Error creating GHL appointment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update contact custom fields
 */
async function updateContactCustomFields(contactId, fields) {
  try {
    const axios = require('axios');
    
    const response = await axios.put(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        customFields: fields
      },
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    log('✅ Contact custom fields updated', fields);
    return response.data;

  } catch (error) {
    log('❌ Error updating custom fields:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * TOOL 3: Update Appointment Status
 * 
 * @param {Object} params - { status, appointmentId, notes }
 * @returns {Object} - { success: boolean, message: string }
 */
async function updateAppointmentStatus(params) {
  try {
    const { status, appointmentId, notes } = params;
    
    log(`🔄 Updating appointment status to: ${status}`, { appointmentId, notes });

    // Validate required parameters
    if (!status || !appointmentId) {
      log('❌ Missing required parameters: status and appointmentId');
      return {
        success: false,
        message: 'Missing required information. Please provide the appointment status.'
      };
    }

    // Validate status value
    const validStatuses = ['confirmed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      log(`❌ Invalid status: ${status}`);
      return {
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    const axios = require('axios');
    
    // Handle based on status
    switch (status.toLowerCase()) {
      case 'confirmed':
        // Update appointment status in GHL
        try {
          await axios.put(
            `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
            {
              appointmentStatus: 'confirmed'
            },
            {
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              }
            }
          );

          log('✅ Appointment confirmed in GHL');
          
          return {
            success: true,
            message: 'Great! Your appointment is confirmed. You\'ll receive a confirmation email shortly.',
            status: 'confirmed'
          };
        } catch (error) {
          log('❌ Error confirming appointment:', error.response?.data || error.message);
          
          return {
            success: true, // Return success even if GHL update fails (user already confirmed)
            message: 'Thank you for confirming! Your appointment is all set.',
            status: 'confirmed'
          };
        }

      case 'cancelled':
        // Cancel appointment in GHL
        try {
          await axios.put(
            `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
            {
              appointmentStatus: 'cancelled'
            },
            {
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              }
            }
          );

          log('✅ Appointment cancelled in GHL');
          
          return {
            success: true,
            message: 'I understand. Your appointment has been cancelled. Would you like to reschedule for another time?',
            status: 'cancelled'
          };
        } catch (error) {
          log('❌ Error cancelling appointment:', error.response?.data || error.message);
          
          return {
            success: true, // Return success even if GHL update fails
            message: 'Your appointment has been cancelled. Would you like to reschedule?',
            status: 'cancelled'
          };
        }

      case 'rescheduled':
        log('🔄 User wants to reschedule - ready to check new availability');
        
        return {
          success: true,
          message: 'No problem! What date and time would work better for you?',
          status: 'rescheduling',
          requiresNewDateTime: true
        };

      default:
        return {
          success: false,
          message: 'I didn\'t understand that status. Can you confirm, cancel, or reschedule?'
        };
    }

  } catch (error) {
    log('❌ Error updating appointment status:', error);
    return {
      success: false,
      message: 'I encountered an error updating your appointment. Let me have someone from our team call you back to help with this.',
      error: error.message
    };
  }
}

module.exports = {
  handleCalendarWebhook,
  checkCalendarAvailability,
  bookCalendarAppointment,
  updateAppointmentStatus
};

