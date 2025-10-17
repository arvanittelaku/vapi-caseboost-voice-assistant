const express = require('express');
const contextManager = require('../services/context-manager');

/**
 * ContextTransferWebhook - Handles context-aware transfers between Squad agents
 * 
 * This webhook enriches transfers with conversation summaries
 */
class ContextTransferWebhook {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Main routing endpoint with context
    this.router.post('/route-with-context', this.handleRouteWithContext.bind(this));
    
    // Record conversation messages
    this.router.post('/record-message', this.handleRecordMessage.bind(this));
    
    // Get conversation summary
    this.router.get('/summary/:conversationId', this.handleGetSummary.bind(this));
    
    // Memory statistics
    this.router.get('/memory-stats', this.handleMemoryStats.bind(this));
  }

  /**
   * Handle routing to sub-agent with automatic context passing
   */
  async handleRouteWithContext(req, res) {
    try {
      const { agentName, conversationId, additionalContext, message } = req.body;

      // Validate required fields
      if (!agentName) {
        return res.status(400).json({
          success: false,
          error: 'agentName is required',
          availableAgents: ['paula', 'alex', 'peter', 'patricia']
        });
      }

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'conversationId is required'
        });
      }

      console.log('\n🎯 Route with context request received:');
      console.log(`   Agent: ${agentName}`);
      console.log(`   Conversation: ${conversationId}`);

      // If a user message is provided, record it first
      if (message?.content) {
        contextManager.addMessage(
          conversationId,
          message.role || 'user',
          message.content,
          { source: 'webhook', ...message.metadata }
        );
      }

      // Route to sub-agent with context
      const result = await contextManager.routeToSubAgent(
        agentName,
        conversationId,
        additionalContext
      );

      if (result.success) {
        res.json({
          success: true,
          transfer: {
            targetAgent: result.agentName,
            targetAgentId: result.agentId,
            contextSummary: result.contextSummary,
            conversationId
          },
          // This payload can be used to make the actual VAPI transfer call
          vapiPayload: result.payload,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Error in route-with-context:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Record a conversation message
   */
  async handleRecordMessage(req, res) {
    try {
      const { conversationId, role, content, metadata } = req.body;

      if (!conversationId || !role || !content) {
        return res.status(400).json({
          success: false,
          error: 'conversationId, role, and content are required'
        });
      }

      const message = contextManager.addMessage(
        conversationId,
        role,
        content,
        metadata
      );

      res.json({
        success: true,
        message: 'Message recorded',
        data: message
      });

    } catch (error) {
      console.error('❌ Error recording message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get conversation summary
   */
  async handleGetSummary(req, res) {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const history = contextManager.getConversationHistory(conversationId, limit);
      
      if (history.length === 0) {
        return res.json({
          success: true,
          conversationId,
          summary: 'No conversation history available',
          messageCount: 0
        });
      }

      const summary = await contextManager.generateSummary(history);

      res.json({
        success: true,
        conversationId,
        summary,
        messageCount: history.length,
        messages: history
      });

    } catch (error) {
      console.error('❌ Error getting summary:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get memory statistics
   */
  handleMemoryStats(req, res) {
    try {
      const stats = contextManager.getMemoryStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error getting memory stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ContextTransferWebhook;

