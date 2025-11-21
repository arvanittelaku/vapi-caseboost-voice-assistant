require("dotenv").config();

/**
 * Verification script to check if VAPI tool configurations were fixed correctly
 */

const VAPI_API_KEY = "00970406-6727-4a32-a7dc-66a2bacc2693";
const VAPI_BASE_URL = "https://api.vapi.ai";

const TOOL_IDS = {
  update_status: "4ccbd644-fe16-46d2-8385-bc00930bc15f",
  book_appointment: "114582b4-d14d-4445-9e77-3cdd9fceb2a7",
  check_availability: "ec8ac721-c6e4-4d5c-928e-90acae3603f8"
};

async function fetchTool(toolId) {
  try {
    const url = `${VAPI_BASE_URL}/tool/${toolId}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

async function verifyFixes() {
  console.log("\n" + "=".repeat(80));
  console.log("✅ VERIFYING VAPI TOOL CONFIGURATION FIXES");
  console.log("=".repeat(80));
  
  let allFixed = true;
  
  // CHECK FIX #1: update_appointment_status_caseboost status enum
  console.log("\n🔍 Checking Fix #1: update_appointment_status_caseboost status enum...");
  const updateTool = await fetchTool(TOOL_IDS.update_status);
  
  if (!updateTool) {
    console.log("   ❌ Failed to fetch tool");
    allFixed = false;
  } else {
    const statusParam = updateTool.function?.parameters?.properties?.status;
    const statusEnum = statusParam?.enum || [];
    
    console.log(`   Current enum: [${statusEnum.map(s => `"${s}"`).join(", ")}]`);
    
    // Check if it has the correct values
    const hasConfirmed = statusEnum.includes("confirmed");
    const hasCanceled = statusEnum.includes("canceled"); // American spelling
    const hasCancelled = statusEnum.includes("cancelled"); // British spelling (should NOT be present)
    const hasNeedsReschedule = statusEnum.includes("needs_reschedule"); // Should NOT be present
    
    if (hasConfirmed && hasCanceled && !hasCancelled && !hasNeedsReschedule) {
      console.log("   ✅ Status enum is CORRECT!");
      console.log("      ✅ Has 'confirmed'");
      console.log("      ✅ Has 'canceled' (American spelling)");
      console.log("      ✅ Does NOT have 'cancelled' (British spelling)");
      console.log("      ✅ Does NOT have 'needs_reschedule'");
    } else {
      console.log("   ❌ Status enum needs fixing:");
      if (!hasConfirmed) console.log("      ❌ Missing 'confirmed'");
      if (!hasCanceled) console.log("      ❌ Missing 'canceled' (American spelling)");
      if (hasCancelled) console.log("      ⚠️  Has 'cancelled' (British spelling) - should be 'canceled'");
      if (hasNeedsReschedule) console.log("      ⚠️  Has 'needs_reschedule' - should be removed");
      allFixed = false;
    }
  }
  
  // CHECK FIX #2 (Optional): book_calendar_appointment_caseboost oldAppointmentId required
  console.log("\n🔍 Checking Fix #2 (Optional): book_calendar_appointment_caseboost oldAppointmentId...");
  const bookTool = await fetchTool(TOOL_IDS.book_appointment);
  
  if (!bookTool) {
    console.log("   ❌ Failed to fetch tool");
  } else {
    const requiredParams = bookTool.function?.parameters?.required || [];
    const hasOldAppointmentId = requiredParams.includes("oldAppointmentId");
    
    if (hasOldAppointmentId) {
      console.log("   ✅ oldAppointmentId is REQUIRED (recommended for reschedule flow)");
    } else {
      console.log("   ⚪ oldAppointmentId is OPTIONAL");
      console.log("      This is OK - server handles both new bookings and reschedules");
      console.log("      But making it required ensures better error handling for reschedules");
    }
  }
  
  // CHECK #3: All tool URLs are correct
  console.log("\n🔍 Checking Tool URLs...");
  const tools = [
    { id: TOOL_IDS.update_status, name: "update_appointment_status_caseboost", expectedUrl: "https://vapi-caseboost-voice-assistant.onrender.com/webhook/update-appointment-status" },
    { id: TOOL_IDS.book_appointment, name: "book_calendar_appointment_caseboost", expectedUrl: "https://vapi-caseboost-voice-assistant.onrender.com/webhook/book-appointment" },
    { id: TOOL_IDS.check_availability, name: "check_calendar_availability_caseboost", expectedUrl: "https://vapi-caseboost-voice-assistant.onrender.com/webhook/check-availability" }
  ];
  
  for (const toolInfo of tools) {
    const tool = await fetchTool(toolInfo.id);
    if (tool) {
      const actualUrl = tool.server?.url || "N/A";
      const urlMatch = actualUrl === toolInfo.expectedUrl;
      console.log(`   ${urlMatch ? "✅" : "❌"} ${toolInfo.name}`);
      console.log(`      URL: ${actualUrl}`);
      if (!urlMatch) {
        console.log(`      Expected: ${toolInfo.expectedUrl}`);
        allFixed = false;
      }
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(80));
  
  if (allFixed) {
    console.log("\n✅ ALL CRITICAL FIXES APPLIED!");
    console.log("\n🎉 Your VAPI assistant is now correctly configured!");
    console.log("\n📋 Next steps:");
    console.log("   1. Configure phone number in VAPI (after purchase)");
    console.log("   2. Change GHL workflow Wait to '1 hour before appointment'");
    console.log("   3. Test with a real appointment");
    console.log("   4. Go live!");
  } else {
    console.log("\n⚠️  SOME FIXES STILL NEEDED - See details above");
    console.log("\nPlease make the changes in VAPI Dashboard and run this script again.");
  }
  
  console.log("=".repeat(80) + "\n");
  
  return allFixed;
}

verifyFixes().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error("\n❌ Script error:", error);
  process.exit(1);
});

