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

