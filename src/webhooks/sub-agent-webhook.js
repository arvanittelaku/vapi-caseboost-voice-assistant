/**
 * Sub-Agent Webhook Handler
 * Endpoint for VAPI to call for dynamic sub-agent routing
 */

const express = require('express');
const SubAgentRouter = require('../services/sub-agent-router');

class SubAgentWebhook {
  constructor() {
    this.router = express.Router();
    this.subAgentRouter = new SubAgentRouter();
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Main routing endpoint
    this.router.post('/route-sub-agent', this.handleRouting.bind(this));
    
    // Routing explanation endpoint (for debugging)
    this.router.post('/explain-routing', this.handleExplain.bind(this));
    
    // Routing stats endpoint (for monitoring)
    this.router.get('/routing-stats', this.handleStats.bind(this));
    
    // Test routing endpoint (for validation)
    this.router.post('/test-routing', this.handleTest.bind(this));
  }

  /**
   * Handle sub-agent routing request from VAPI
   */
  async handleRouting(req, res) {
    try {
      const { userMessage, conversationId, metadata, currentAgent } = req.body;

      // Validate required fields
      if (!userMessage) {
        return res.status(400).json({
          error: 'userMessage is required',
          routed: false
        });
      }

      // Log incoming request
      console.log('🎯 Routing request received:', {
        conversationId: conversationId || 'unknown',
        messagePreview: userMessage.substring(0, 100) + (userMessage.length > 100 ? '...' : ''),
        currentAgent: currentAgent || 'sarah'
      });

      // Route to appropriate sub-agent
      const routingResult = this.subAgentRouter.route({
        userMessage,
        conversationId: conversationId || this.generateConversationId(),
        metadata: metadata || {},
        currentAgent: currentAgent || null
      });

      // Log routing decision
      if (routingResult.routed) {
        console.log(`✅ Routed to ${routingResult.agent.name} (${(routingResult.confidence * 100).toFixed(1)}% confidence)`);
      } else {
        console.log(`⚠️ No routing - staying with ${routingResult.agent.name} (${routingResult.reason})`);
      }

      // Return routing result
      res.json(routingResult);

    } catch (error) {
      console.error('❌ Routing error:', error);
      res.status(500).json({
        error: 'Internal routing error',
        message: error.message,
        routed: false
      });
    }
  }

  /**
   * Handle routing explanation request (debugging)
   */
  async handleExplain(req, res) {
    try {
      const { userMessage, context } = req.body;

      if (!userMessage) {
        return res.status(400).json({ error: 'userMessage is required' });
      }

      const explanation = this.subAgentRouter.explainRouting(userMessage, context || {});
      
      res.json(explanation);

    } catch (error) {
      console.error('❌ Explanation error:', error);
      res.status(500).json({
        error: 'Internal error',
        message: error.message
      });
    }
  }

  /**
   * Handle routing stats request (monitoring)
   */
  async handleStats(req, res) {
    try {
      const stats = this.subAgentRouter.getRoutingStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Stats error:', error);
      res.status(500).json({
        error: 'Internal error',
        message: error.message
      });
    }
  }

  /**
   * Handle test routing request (validation)
   */
  async handleTest(req, res) {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'messages array is required'
        });
      }

      const results = this.subAgentRouter.testRouting(messages);
      
      res.json({
        success: true,
        testCount: messages.length,
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Test error:', error);
      res.status(500).json({
        error: 'Internal error',
        message: error.message
      });
    }
  }

  /**
   * Generate a conversation ID if not provided
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the Express router
   */
  getRouter() {
    return this.router;
  }
}

module.exports = SubAgentWebhook;

