/**
 * Test script for Confirmation SMS workflows
 * 
 * Tests all 4 SMS scenarios:
 * 1. Confirmed
 * 2. Rescheduled
 * 3. Cancelled
 * 4. No Answer
 * 
 * Usage:
 *   node test-confirmation-sms.js confirmed
 *   node test-confirmation-sms.js rescheduled
 *   node test-confirmation-sms.js cancelled
 *   node test-confirmation-sms.js no_answer
 *   node test-confirmation-sms.js all
 */

require("dotenv").config();
const axios = require("axios");

// Configuration
const SERVER_URL = process.env.WEBHOOK_BASE_URL || "http://localhost:3001";
const TEST_CONTACT_ID = process.env.TEST_CONTACT_ID || "REPLACE_WITH_REAL_CONTACT_ID";
const TEST_FIRST_NAME = "John";

// Test payloads
const payloads = {
  confirmed: {
    outcome: "confirmed",
    contactId: TEST_CONTACT_ID,
    firstName: TEST_FIRST_NAME,
  },
  
  rescheduled: {
    outcome: "rescheduled",
    contactId: TEST_CONTACT_ID,
    firstName: TEST_FIRST_NAME,
    newAppointmentTime: "Tomorrow at 2:00 PM EST",
  },
  
  cancelled: {
    outcome: "cancelled",
    contactId: TEST_CONTACT_ID,
    firstName: TEST_FIRST_NAME,
  },
  
  no_answer: {
    outcome: "no_answer",
    contactId: TEST_CONTACT_ID,
    firstName: TEST_FIRST_NAME,
    appointmentTime: "Today at 2:00 PM",
  },
};

async function testConfirmationSMS(scenario) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📱 Testing: ${scenario.toUpperCase()}`);
  console.log("=".repeat(80));

  const payload = payloads[scenario];
  if (!payload) {
    console.error(`❌ Unknown scenario: ${scenario}`);
    return false;
  }

  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\nSending request to:", `${SERVER_URL}/webhook/confirmation-outcome`);

  try {
    const response = await axios.post(
      `${SERVER_URL}/webhook/confirmation-outcome`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    console.log("\n✅ SUCCESS");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error("\n❌ ERROR");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return false;
  }
}

async function testAll() {
  console.log("\n" + "🚀 ".repeat(40));
  console.log("TESTING ALL CONFIRMATION SMS SCENARIOS");
  console.log("🚀 ".repeat(40));
  
  const scenarios = ["confirmed", "rescheduled", "cancelled", "no_answer"];
  const results = {};
  
  for (const scenario of scenarios) {
    const success = await testConfirmationSMS(scenario);
    results[scenario] = success;
    
    // Wait 2 seconds between tests
    if (scenario !== scenarios[scenarios.length - 1]) {
      console.log("\n⏳ Waiting 2 seconds before next test...\n");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80));
  
  let allPassed = true;
  for (const [scenario, success] of Object.entries(results)) {
    const icon = success ? "✅" : "❌";
    console.log(`${icon} ${scenario}: ${success ? "PASSED" : "FAILED"}`);
    if (!success) allPassed = false;
  }
  
  console.log("=".repeat(80));
  console.log(allPassed ? "✅ ALL TESTS PASSED!" : "❌ SOME TESTS FAILED");
  console.log("=".repeat(80) + "\n");
}

// Main execution
const scenario = process.argv[2] || "help";

if (scenario === "help" || !scenario) {
  console.log("\n📱 Confirmation SMS Test Script\n");
  console.log("Usage:");
  console.log("  node test-confirmation-sms.js <scenario>\n");
  console.log("Scenarios:");
  console.log("  confirmed   - Test confirmation SMS");
  console.log("  rescheduled - Test reschedule SMS");
  console.log("  cancelled   - Test cancellation SMS");
  console.log("  no_answer   - Test no-answer follow-up SMS");
  console.log("  all         - Test all scenarios\n");
  console.log("Environment Variables:");
  console.log("  WEBHOOK_BASE_URL - Your server URL (default: http://localhost:3001)");
  console.log("  TEST_CONTACT_ID  - GHL contact ID for testing\n");
  process.exit(0);
}

if (scenario === "all") {
  testAll().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} else if (payloads[scenario]) {
  testConfirmationSMS(scenario).catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} else {
  console.error(`❌ Unknown scenario: ${scenario}`);
  console.log('Valid scenarios: confirmed, rescheduled, cancelled, no_answer, all');
  process.exit(1);
}

