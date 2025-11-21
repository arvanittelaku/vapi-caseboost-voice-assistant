require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const vapiWebhookHandler = require("./webhooks/vapi-webhook.blueprint");
const ghlRetryWebhookHandler = require("./webhooks/ghl-retry-webhook.blueprint");
const ghlInitialCallHandler = require("./webhooks/ghl-initial-call-webhook.blueprint");
const appointmentWebhooks = require("./webhooks/appointment-webhooks.blueprint");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Increase payload limit for large VAPI webhook payloads (status-update can be 200KB+)
app.use(bodyParser.json({ limit: '500kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "VAPI CaseBoost Voice Assistant",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "GET /health",
      webhook: "POST /webhook/vapi",
      initialCall: "POST /webhook/ghl-initial-call",
      retry: "POST /webhook/ghl-retry",
      updateAppointmentStatus: "POST /webhook/update-appointment-status",
      checkAvailability: "POST /webhook/check-availability",
      bookAppointment: "POST /webhook/book-appointment",
    },
    documentation: "API server for VAPI voice assistant with GHL integration",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Debug endpoint to check environment variables
app.get("/debug-env", (req, res) => {
  res.json({
    GHL_CALENDAR_ID: process.env.GHL_CALENDAR_ID,
    GHL_LOCATION_ID: process.env.GHL_LOCATION_ID,
    GHL_API_KEY_PREFIX: process.env.GHL_API_KEY?.substring(0, 20) + "...",
    GHL_USER_ID: process.env.GHL_USER_ID || "Not set",
    CALENDAR_TIMEZONE: process.env.CALENDAR_TIMEZONE || "America/New_York",
    NODE_ENV: process.env.NODE_ENV,
  });
});

// Debug endpoint to get calendar details (includes assigned user/team member ID)
app.get("/debug-ghl-calendar", async (req, res) => {
  try {
    const calendarId = process.env.GHL_CALENDAR_ID;
    const url = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
    
    console.log("\n=== DEBUG GHL CALENDAR ===");
    console.log("Request URL:", url);
    console.log("Calendar ID:", calendarId);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
    });
    
    const responseText = await response.text();
    console.log("Response Status:", response.status);
    console.log("Response Body:", responseText);
    console.log("======================\n");
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }
    
    // Try to extract user/team member IDs
    let extractedInfo = {
      teamMembers: null,
      assignedUsers: null,
      userId: null,
    };
    
    if (data && typeof data === 'object') {
      // Look for common fields that might contain user IDs
      extractedInfo.teamMembers = data.teamMembers || data.team_members || data.users;
      extractedInfo.assignedUsers = data.assignedUsers || data.assigned_users;
      extractedInfo.userId = data.userId || data.user_id || data.ownerId || data.owner_id;
    }
    
    res.json({
      request: {
        url,
        calendarId,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data,
      },
      extractedInfo,
      hint: "Look for 'teamMembers', 'assignedUsers', 'userId', or similar fields in the data above",
    });
  } catch (error) {
    console.error("Error in debug-ghl-calendar:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Debug endpoint to check GHL slots API response
app.get("/debug-ghl-slots", async (req, res) => {
  try {
    const { DateTime } = require("luxon");
    const calendarId = process.env.GHL_CALENDAR_ID;
    const locationId = process.env.GHL_LOCATION_ID;
    const userId = process.env.GHL_USER_ID;
    
    // WORKAROUND: Calendar is stuck in London timezone, so request in London timezone
    const calendarTimezone = "Europe/London";
    const userTimezone = process.env.CALENDAR_TIMEZONE || "America/New_York";
    
    // Get the date to check (use query param or default to Dec 24, 2025)
    const dateParam = req.query.date || "2025-12-24";
    
    // Parse date in user's timezone, but convert to calendar timezone for API request
    const userDate = DateTime.fromISO(dateParam, { zone: userTimezone });
    const calendarDate = userDate.setZone(calendarTimezone).startOf('day');
    const startDate = calendarDate.toMillis();
    const endDate = calendarDate.endOf('day').toMillis();
    
    // Try requesting in CALENDAR timezone (London) instead of user timezone
    const useCalendarTimezone = req.query.useCalendarTz !== 'false';
    const requestTimezone = useCalendarTimezone ? calendarTimezone : userTimezone;
    
    let url = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(requestTimezone)}`;
    
    // Add userId as query param to toggle it on/off
    const includeUserId = req.query.includeUserId !== 'false';
    if (userId && includeUserId) {
      url += `&userId=${userId}`;
    }
    
    console.log("\n=== DEBUG GHL SLOTS ===");
    console.log("Request URL:", url);
    console.log("Calendar ID:", calendarId);
    console.log("Location ID:", locationId);
    console.log("User ID:", userId || "Not set");
    console.log("User Timezone:", userTimezone);
    console.log("Calendar Timezone:", calendarTimezone);
    console.log("Request Timezone:", requestTimezone);
    console.log("Date (readable):", calendarDate.toFormat("yyyy-MM-dd"));
    console.log("Start Timestamp:", startDate, "(" + calendarDate.toISO() + ")");
    console.log("End Timestamp:", endDate, "(" + calendarDate.endOf('day').toISO() + ")");
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });
    
    const responseText = await response.text();
    console.log("Response Status:", response.status);
    console.log("Response Body:", responseText);
    console.log("======================\n");
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }
    
    // Count slots if successful
    let slotCount = 0;
    if (response.ok && typeof data === 'object') {
      for (const date in data) {
        if (date !== 'traceId' && data[date]?.slots) {
          slotCount += data[date].slots.length;
        }
      }
    }
    
    res.json({
      request: {
        url,
        calendarId,
        locationId,
        userId: userId || "Not set - ADD GHL_USER_ID to env vars!",
        userTimezone,
        calendarTimezone,
        requestTimezone,
        date: calendarDate.toFormat("yyyy-MM-dd"),
        startDate,
        endDate,
        startDateReadable: calendarDate.toISO(),
        endDateReadable: calendarDate.endOf('day').toISO(),
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data,
        slotCount,
      },
      note: "Testing with calendar timezone (London) instead of user timezone to work around timezone mismatch",
    });
  } catch (error) {
    console.error("Error in debug-ghl-slots:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// VAPI webhook endpoint
app.post("/webhook/vapi", vapiWebhookHandler);

// GHL initial call webhook endpoint (called by GHL workflow when contact is created)
app.post("/webhook/ghl-initial-call", ghlInitialCallHandler);

// GHL retry webhook endpoint (called by GHL workflow for scheduled retries)
app.post("/webhook/ghl-retry", ghlRetryWebhookHandler);

// Appointment management webhooks (called by VAPI function tools)
app.post("/webhook/update-appointment-status", appointmentWebhooks.handleUpdateAppointmentStatus);
app.post("/webhook/check-availability", appointmentWebhooks.handleCheckAvailability);
app.post("/webhook/book-appointment", appointmentWebhooks.handleBookNewAppointment);

// Debug endpoint to check appointments for a specific date
app.get("/debug-check-appointments", async (req, res) => {
  try {
    const { DateTime } = require("luxon");
    const calendarId = process.env.GHL_CALENDAR_ID;
    const timezone = process.env.CALENDAR_TIMEZONE || "America/New_York";
    const dateParam = req.query.date || "2025-11-24";
    
    const targetDate = DateTime.fromISO(dateParam, { zone: timezone });
    const startDate = targetDate.startOf('day').toMillis();
    const endDate = targetDate.endOf('day').toMillis();
    
    const url = `https://services.leadconnectorhq.com/calendars/events/appointments?calendarId=${calendarId}&startTime=${startDate}&endTime=${endDate}`;
    
    console.log("\n=== DEBUG APPOINTMENTS ===");
    console.log("Checking appointments for:", dateParam);
    console.log("URL:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: "2021-07-28",
      },
    });
    
    const responseText = await response.text();
    console.log("Response Status:", response.status);
    console.log("Response:", responseText);
    console.log("======================\n");
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }
    
    const appointments = data.events || data.appointments || [];
    
    return res.json({ 
      request: {
        url,
        date: dateParam,
        calendarId,
      },
      response: {
        status: response.status,
        data,
      },
      summary: {
        appointmentCount: Array.isArray(appointments) ? appointments.length : 0,
        appointments: appointments,
      },
      hint: "If there are appointments blocking afternoon slots, they'll show here"
    });
  } catch (error) {
    console.error("Error checking appointments:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`);
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`📡 Webhook: POST /webhook/vapi`);
  console.log(`📞 Initial Call: POST /webhook/ghl-initial-call`);
  console.log(`🔄 Retry: POST /webhook/ghl-retry`);
  console.log(`📅 Update Appointment: POST /webhook/update-appointment-status`);
  console.log(`🗓️  Check Availability: POST /webhook/check-availability`);
  console.log(`📆 Book Appointment: POST /webhook/book-appointment`);
  console.log(`🧪 TEST: GET /test-get-appointments`);
  console.log(`💚 Health: GET /health`);
  console.log(`\n✅ Ready to receive VAPI requests!\n`);
});

