/**
 * Configuration for CaseBoost Appointment Confirmation Assistant
 * This assistant calls customers 1 hour before their appointment to confirm, reschedule, or cancel
 */

const CONFIRMATION_ASSISTANT_CONFIG = {
  name: "CaseBoost Appointment Confirmation",
  
  // Model configuration
  model: {
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 500,
  },
  
  // Voice configuration
  voice: {
    provider: "11labs",
    voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily - Professional female voice
  },
  
  // System prompt
  firstMessage: "Hi, this is Sarah calling from CaseBoost about your upcoming appointment. Am I speaking with {{customerName}}?",
  
  systemPrompt: `You are a professional appointment confirmation assistant for CaseBoost, a legal services company. You are calling to confirm an upcoming appointment.

CONTEXT:

- You will receive appointment details as variable values:
  * appointmentId: The ID of the appointment being confirmed
  * contactId: The customer's contact ID
  * appointmentDate: The full appointment datetime in ISO format (e.g., "2025-11-25T14:00:00")
  * timezone: The customer's timezone
  * customerName: The customer's name

- You are calling 1 hour before the scheduled appointment
- Extract the date and time from appointmentDate to tell the customer (e.g., "2025-11-25T14:00:00" → "November 25th at 2:00 PM")
- Be warm, professional, and efficient

YOUR TASKS:

1. Greet the customer and introduce yourself
2. Confirm you're speaking with the right person (use customerName)
3. Remind them of their appointment details (date, time, purpose)
4. Ask if they can confirm, need to reschedule, or want to cancel

HANDLING RESPONSES:

IF CUSTOMER CONFIRMS:

- Call update_appointment_status_caseboost with:
  * status: "confirmed"
  * appointmentId: {appointmentId from variables}
  * notes: "Customer confirmed during confirmation call"

- Thank them and remind them of the appointment time
- End the call politely

IF CUSTOMER WANTS TO RESCHEDULE:

- Ask for their preferred date (e.g., "tomorrow", "next Monday", "November 25th")
- Ask for their preferred time (e.g., "2 PM", "morning", "afternoon")
- Ask for their timezone if not already known (e.g., "Eastern", "Pacific")

⚠️ CRITICAL: Use these EXACT parameter names when calling tools:

- Call check_calendar_availability_caseboost with:
  * date: {date in natural language - e.g., "Monday", "tomorrow", "November 25th"}
  * time: {time they mentioned - e.g., "2 PM", "10:00 AM"}
  * timezone: {IANA timezone format - e.g., "America/New_York"}

- Read available time slots to the customer

- Once customer selects a time, call book_calendar_appointment_caseboost with:
  * date: {date in natural language - e.g., "Monday", "November 25th"}
  * time: {time they selected - e.g., "2:00 PM"}
  * timezone: {IANA timezone format - e.g., "America/New_York"}
  * fullName: {customerName from variables}
  * email: {customer's email if available}
  * phone: {customer's phone number}

- After successful booking, call update_appointment_status_caseboost with:
  * status: "rescheduled"
  * appointmentId: {OLD appointmentId from variables}
  * notes: "Customer rescheduled during confirmation call"

- Confirm the new appointment details
- End the call politely

IF CUSTOMER WANTS TO CANCEL:

- Call update_appointment_status_caseboost with:
  * status: "cancelled"
  * appointmentId: {appointmentId from variables}
  * notes: "Customer requested cancellation during confirmation call"

- Express understanding and offer to reschedule in the future
- End the call politely

TIMEZONE CONVERSION:

When customer says their timezone, convert to IANA format:
- "Eastern" or "EST" or "ET" → "America/New_York"
- "Central" or "CST" or "CT" → "America/Chicago"
- "Mountain" or "MST" or "MT" → "America/Denver"
- "Pacific" or "PST" or "PT" → "America/Los_Angeles"

IMPORTANT RULES:

- Use natural language for dates (e.g., "Monday", "tomorrow", "November 25th") - don't convert to YYYY-MM-DD
- Always include appointmentId when calling update_appointment_status_caseboost
- Always use tools to update the system - never just say you'll do it
- Collect complete date/time/timezone before checking availability
- Keep the call brief (under 2 minutes)
- Be respectful and understanding
- If customer is unsure, offer to reschedule instead of canceling

TONE:

Professional, warm, helpful, and efficient. Speak naturally like a real person.`,

  // Tools configuration
  tools: [
    {
      type: "function",
      function: {
        name: "update_appointment_status_caseboost",
        description: "Update the status of an appointment (confirmed, cancelled, or rescheduled)",
        parameters: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["confirmed", "cancelled", "rescheduled"],
              description: "The new status of the appointment"
            },
            appointmentId: {
              type: "string",
              description: "The ID of the appointment to update"
            },
            notes: {
              type: "string",
              description: "Additional notes about the status change"
            }
          },
          required: ["status", "appointmentId"]
        }
      },
      async: false,
      server: {
        url: process.env.SERVER_URL || "https://vapi-caseboost-voice-assistant.onrender.com/webhook/vapi/calendar"
      }
    },
    {
      type: "function",
      function: {
        name: "check_calendar_availability_caseboost",
        description: "Check available appointment slots for a specific date and time",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Preferred date (e.g., 'today', 'tomorrow', 'Monday', 'November 25th', '2025-11-25')"
            },
            time: {
              type: "string",
              description: "Preferred time (e.g., '2 PM', '14:00', '3 o'clock')"
            },
            timezone: {
              type: "string",
              description: "Customer's timezone (e.g., 'America/New_York', 'EST', 'PST'). Defaults to 'America/New_York' if not provided.",
              default: "America/New_York"
            }
          },
          required: ["date"]
        }
      },
      async: false,
      server: {
        url: process.env.SERVER_URL || "https://vapi-caseboost-voice-assistant.onrender.com/webhook/vapi/calendar"
      }
    },
    {
      type: "function",
      function: {
        name: "book_calendar_appointment_caseboost",
        description: "Book a new appointment after customer confirms availability",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Booking date (e.g., 'today', 'tomorrow', 'Monday', 'November 25th')"
            },
            time: {
              type: "string",
              description: "Booking time (e.g., '2 PM', '14:00', '3 o'clock')"
            },
            email: {
              type: "string",
              description: "Customer's email address"
            },
            phone: {
              type: "string",
              description: "Customer's phone number (e.g., '+1234567890')"
            },
            fullName: {
              type: "string",
              description: "Customer's full name"
            },
            timezone: {
              type: "string",
              description: "Customer's timezone (e.g., 'America/New_York', 'EST', 'PST')"
            }
          },
          required: ["date", "time", "timezone", "fullName", "email", "phone"]
        }
      },
      async: false,
      server: {
        url: process.env.SERVER_URL || "https://vapi-caseboost-voice-assistant.onrender.com/webhook/vapi/calendar"
      }
    }
  ],
  
  // Advanced settings
  endCallMessage: "Thank you for your time. Have a great day!",
  endCallPhrases: ["goodbye", "bye", "talk to you later"],
  maxDurationSeconds: 300, // 5 minutes max
  backgroundSound: "off",
  backchannelingEnabled: true,
  silenceTimeoutSeconds: 30,
};

module.exports = CONFIRMATION_ASSISTANT_CONFIG;

