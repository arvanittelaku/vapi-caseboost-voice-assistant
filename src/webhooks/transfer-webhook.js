const express = require('express');

// Assistant IDs for transfers
const SPECIALIST_IDS = {
  paula: '8c09f5c7-c1f8-4015-b632-19b51456b522',
  alex: 'c27cd255-230c-4a00-bd0d-8fb0dd97976a',
  peter: '11a75fe5-0bbf-4c09-99bc-548830cd6af8',
  patricia: 'e3152d1f-4e00-44f3-a5de-5125bbde4cc6'
};

class TransferWebhook {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Handle transfer function calls from VAPI
    this.router.post('/transfer', this.handleTransfer.bind(this));
  }

  async handleTransfer(req, res) {
    try {
      const { message } = req.body;
      
      // Extract function call parameters
      const functionCall = message?.toolCalls?.[0] || message?.functionCall;
      
      if (!functionCall) {
        console.log('⚠️  No function call found in request');
        return res.json({
          results: [{
            toolCallId: message?.toolCalls?.[0]?.id,
            result: 'No function call parameters provided'
          }]
        });
      }

      const { specialist, reason, userContext } = functionCall.function?.arguments || 
                                                   JSON.parse(functionCall.arguments || '{}');

      console.log('\n🔄 TRANSFER REQUEST:');
      console.log(`   Specialist: ${specialist}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Context: ${userContext || 'None'}\n`);

      // Get the specialist's assistant ID
      const specialistId = SPECIALIST_IDS[specialist];

      if (!specialistId) {
        console.error(`❌ Unknown specialist: ${specialist}`);
        return res.json({
          results: [{
            toolCallId: functionCall.id,
            result: `Error: Unknown specialist ${specialist}`
          }]
        });
      }

      // Return transfer instruction to VAPI
      const response = {
        results: [{
          toolCallId: functionCall.id,
          result: `Transferring to ${specialist}...`
        }],
        // Tell VAPI to transfer the call
        destination: {
          type: "assistant",
          assistantId: specialistId,
          message: `Let me connect you with our specialist...`,
          description: reason
        }
      };

      console.log(`✅ Transferring to ${specialist} (ID: ${specialistId})`);
      
      res.json(response);

    } catch (error) {
      console.error('❌ Transfer error:', error);
      res.status(500).json({
        error: 'Transfer failed',
        message: error.message
      });
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = TransferWebhook;

