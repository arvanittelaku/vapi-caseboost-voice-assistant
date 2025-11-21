require("dotenv").config();

console.log("====================================");
console.log("ENVIRONMENT VARIABLES");
console.log("====================================\n");

console.log("GHL_CALENDAR_ID:", process.env.GHL_CALENDAR_ID);
console.log("GHL_API_KEY (first 20 chars):", process.env.GHL_API_KEY?.substring(0, 20) + "...");
console.log("GHL_LOCATION_ID:", process.env.GHL_LOCATION_ID);
console.log("CALENDAR_TIMEZONE:", process.env.CALENDAR_TIMEZONE || "America/New_York");
console.log("\n====================================");

