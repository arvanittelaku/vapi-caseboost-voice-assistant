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
    CALENDAR_TIMEZONE: process.env.CALENDAR_TIMEZONE || "America/New_York",
    NODE_ENV: process.env.NODE_ENV,
  });
});

// Debug endpoint to check GHL slots API response
app.get("/debug-ghl-slots", async (req, res) => {
  try {
    const { DateTime } = require("luxon");
    const calendarId = process.env.GHL_CALENDAR_ID;
    const locationId = process.env.GHL_LOCATION_ID;
    const timezone = process.env.CALENDAR_TIMEZONE || "America/New_York";
    
    // Get the date to check (use query param or default to Dec 24, 2025)
    const dateParam = req.query.date || "2025-12-24";
    const targetDate = DateTime.fromISO(dateParam, { zone: timezone }).startOf('day');
    const startDate = targetDate.toMillis();  // Unix timestamp in milliseconds
    const endDate = targetDate.endOf('day').toMillis();  // Unix timestamp in milliseconds
    
    const url = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(timezone)}`;
    
    console.log("\n=== DEBUG GHL SLOTS ===");
    console.log("Request URL:", url);
    console.log("Calendar ID:", calendarId);
    console.log("Location ID:", locationId);
    console.log("Timezone:", timezone);
    console.log("Date (readable):", targetDate.toFormat("yyyy-MM-dd"));
    console.log("Start Timestamp:", startDate, "(" + targetDate.toISO() + ")");
    console.log("End Timestamp:", endDate, "(" + targetDate.endOf('day').toISO() + ")");
    
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
        timezone,
        date: targetDate.toFormat("yyyy-MM-dd"),
        startDate,
        endDate,
        startDateReadable: targetDate.toISO(),
        endDateReadable: targetDate.endOf('day').toISO(),
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data,
        slotCount,
      },
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

// Temporary test endpoint to get appointments
app.get("/test-get-appointments", async (req, res) => {
  try {
    const calendarId = process.env.GHL_CALENDAR_ID || "yipdEzKHohzoYmhg2Ctv";
    
    // Try the appointments endpoint with calendarId
    const url = `https://services.leadconnectorhq.com/calendars/events/appointments?calendarId=${calendarId}`;
    
    console.log("Fetching appointments from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: "2021-07-28",
      },
    });
    
    const responseText = await response.text();
    console.log("GHL API Response Status:", response.status);
    console.log("GHL API Response:", responseText);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "GHL API Error", 
        status: response.status,
        details: responseText 
      });
    }
    
    const data = JSON.parse(responseText);
    
    return res.json({ 
      success: true, 
      appointments: data.events || data || [],
      message: "All appointments for calendar: " + calendarId
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
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

