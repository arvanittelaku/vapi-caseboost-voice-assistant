require("dotenv").config();

/**
 * VAPI Client
 * 
 * Handles VAPI API calls for creating outbound calls
 */
class VAPIClient {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.baseUrl = "https://api.vapi.ai";
  }

  /**
   * Create an outbound call
   */
  async createCall(callData) {
    try {
      console.log(`📞 [VAPI] Creating call...`);
      console.log(`   Phone: ${callData.customer?.number}`);
      console.log(`   Squad ID: ${callData.squadId || "N/A"}`);
      console.log(`   Assistant ID: ${callData.assistantId || "N/A"}`);

      const url = `${this.baseUrl}/call`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [VAPI] Call creation failed:`, errorText);
        throw new Error(`VAPI API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ [VAPI] Call created successfully`);
      console.log(`   Call ID: ${result.id}`);

      return result;
    } catch (error) {
      console.error("❌ [VAPI] Error creating call:", error.message);
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCall(callId) {
    try {
      const url = `${this.baseUrl}/call/${callId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`VAPI API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ [VAPI] Error getting call:", error.message);
      throw error;
    }
  }
}

module.exports = new VAPIClient();

