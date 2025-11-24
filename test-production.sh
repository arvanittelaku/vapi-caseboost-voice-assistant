#!/bin/bash
# Quick script to test production endpoint after deployment

echo "🧪 Testing Production Endpoint..."
echo ""
WEBHOOK_BASE_URL=https://vapi-caseboost-voice-assistant.onrender.com node scripts/test-vapi-format.js

