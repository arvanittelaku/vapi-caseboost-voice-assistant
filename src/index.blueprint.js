require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const vapiWebhookHandler = require("./webhooks/vapi-webhook.blueprint");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
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
  console.log(`💚 Health: GET /health`);
  console.log(`\n✅ Ready to receive VAPI requests!\n`);
});

