/**
 * Sub-Agent Router
 * Handles routing logic and sub-agent transitions
 */

const IntentDetector = require('./intent-detector');
const { getSubAgent } = require('../config/sub-agents');
const config = require('../config/assistant-config');

class SubAgentRouter {
  constructor() {
    this.intentDetector = new IntentDetector();
    this.routingHistory = new Map(); // Track routing per conversation
  }

  /**
   * Route a conversation to the appropriate sub-agent
   * @param {object} params - Routing parameters
   * @returns {object} - Routing result with sub-agent config
   */
  route({ userMessage, conversationId, metadata = {}, currentAgent = null }) {
    try {
      // Detect intent
      const detection = this.intentDetector.detect(userMessage, {
        conversationId,
        currentAgent,
        ...metadata
      });

      // Get sub-agent configuration
      const subAgent = getSubAgent(detection.agentId);

      // If no sub-agent found (routing to Sarah), use primary config
      if (!subAgent) {
        return this.createPrimaryAgentResponse(detection, conversationId);
      }

      // Create sub-agent response
      const response = this.createSubAgentResponse(subAgent, detection, conversationId, metadata);

      // Store routing history
      this.storeRoutingHistory(conversationId, {
        userMessage,
        detection,
        response,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('❌ Routing error:', error.message);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Create sub-agent response
   */
  createSubAgentResponse(subAgent, detection, conversationId, metadata) {
    // Build context summary from metadata
    const contextSummary = this.buildContextSummary(metadata);

    return {
      routed: true,
      agent: {
        id: subAgent.id,
        name: subAgent.name,
        role: subAgent.role
      },
      systemMessage: this.buildSystemMessage(subAgent, contextSummary),
      greeting: this.personalizeGreeting(subAgent.greeting, metadata),
      confidence: detection.confidence,
      reason: detection.reason,
      knowledgeFiles: subAgent.knowledgeFiles,
      qualificationQuestions: subAgent.qualificationQuestions,
      conversationId,
      metadata: {
        routedAt: new Date().toISOString(),
        previousAgent: metadata.currentAgent || 'sarah',
        contextPreserved: true
      }
    };
  }

  /**
   * Create primary agent (Sarah) response
   */
  createPrimaryAgentResponse(detection, conversationId) {
    return {
      routed: false,
      agent: {
        id: 'sarah',
        name: 'Sarah',
        role: 'Primary Agent'
      },
      systemMessage: config.vapi.model.messages[0].content,
      greeting: null, // Sarah continues without re-greeting
      confidence: detection.confidence,
      reason: detection.reason,
      suggestedAgent: detection.suggestedAgent || null,
      conversationId,
      metadata: {
        routingAttempted: true,
        lowConfidence: true
      }
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(error) {
    return {
      routed: false,
      agent: {
        id: 'sarah',
        name: 'Sarah',
        role: 'Primary Agent'
      },
      error: error.message,
      systemMessage: config.vapi.model.messages[0].content,
      greeting: null
    };
  }

  /**
   * Build enhanced system message with context
   */
  buildSystemMessage(subAgent, contextSummary) {
    let systemMessage = subAgent.systemMessage;

    // Add context if available
    if (contextSummary) {
      systemMessage += `\n\n--- CONVERSATION CONTEXT ---\n${contextSummary}\n--- END CONTEXT ---\n\nContinue the conversation naturally, referencing this context where appropriate.`;
    }

    return systemMessage;
  }

  /**
   * Personalize greeting with metadata
   */
  personalizeGreeting(greeting, metadata) {
    let personalizedGreeting = greeting;

    // Replace placeholders
    if (metadata.firstName) {
      personalizedGreeting = personalizedGreeting.replace(/\{\{firstName\}\}/g, metadata.firstName);
    }

    if (metadata.practiceArea) {
      personalizedGreeting = personalizedGreeting.replace(/\{\{practiceArea\}\}/g, metadata.practiceArea);
    }

    return personalizedGreeting;
  }

  /**
   * Build context summary from metadata
   */
  buildContextSummary(metadata) {
    const summary = [];

    if (metadata.conversationSummary) {
      summary.push(`Previous conversation: ${metadata.conversationSummary}`);
    }

    if (metadata.firstName) {
      summary.push(`Contact name: ${metadata.firstName} ${metadata.lastName || ''}`.trim());
    }

    if (metadata.practiceArea) {
      summary.push(`Practice area of interest: ${metadata.practiceArea}`);
    }

    if (metadata.firmName) {
      summary.push(`Firm: ${metadata.firmName}`);
    }

    if (metadata.phone) {
      summary.push(`Phone: ${metadata.phone}`);
    }

    if (metadata.email) {
      summary.push(`Email: ${metadata.email}`);
    }

    return summary.length > 0 ? summary.join('\n') : null;
  }

  /**
   * Store routing history for analytics
   */
  storeRoutingHistory(conversationId, routingData) {
    if (!this.routingHistory.has(conversationId)) {
      this.routingHistory.set(conversationId, []);
    }

    this.routingHistory.get(conversationId).push(routingData);

    // Keep only last 10 routing events per conversation (memory management)
    const history = this.routingHistory.get(conversationId);
    if (history.length > 10) {
      this.routingHistory.set(conversationId, history.slice(-10));
    }
  }

  /**
   * Get routing history for a conversation
   */
  getRoutingHistory(conversationId) {
    return this.routingHistory.get(conversationId) || [];
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    const stats = {
      totalConversations: this.routingHistory.size,
      totalRoutingEvents: 0,
      agentDistribution: {},
      avgConfidence: 0
    };

    let totalConfidence = 0;
    let count = 0;

    for (const history of this.routingHistory.values()) {
      stats.totalRoutingEvents += history.length;

      for (const event of history) {
        const agentId = event.detection.agentId;
        stats.agentDistribution[agentId] = (stats.agentDistribution[agentId] || 0) + 1;
        totalConfidence += event.detection.confidence;
        count++;
      }
    }

    stats.avgConfidence = count > 0 ? (totalConfidence / count) : 0;

    return stats;
  }

  /**
   * Clear routing history (for testing or memory management)
   */
  clearHistory(conversationId = null) {
    if (conversationId) {
      this.routingHistory.delete(conversationId);
    } else {
      this.routingHistory.clear();
    }
  }

  /**
   * Explain routing decision (for debugging)
   */
  explainRouting(userMessage, context = {}) {
    return this.intentDetector.explainDecision(userMessage, context);
  }

  /**
   * Test routing with multiple messages (for validation)
   */
  testRouting(messages) {
    return messages.map(msg => ({
      message: msg,
      ...this.route({
        userMessage: msg,
        conversationId: 'test-' + Date.now(),
        metadata: {}
      })
    }));
  }
}

module.exports = SubAgentRouter;

