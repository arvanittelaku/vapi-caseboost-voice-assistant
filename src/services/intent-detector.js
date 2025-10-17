/**
 * Intent Detector
 * Analyzes user messages to determine which sub-agent should handle the conversation
 */

const routingConfig = require('../config/routing-config');
const { getSubAgent, getAllSubAgents } = require('../config/sub-agents');

class IntentDetector {
  constructor() {
    this.config = routingConfig;
  }

  /**
   * Detect the best sub-agent for a given message
   * @param {string} userMessage - The user's message
   * @param {object} context - Additional context (conversation history, metadata)
   * @returns {object} - Detection result with agent, confidence, and reasoning
   */
  detect(userMessage, context = {}) {
    if (!userMessage || typeof userMessage !== 'string') {
      return this.createResult(null, 0, 'Invalid or empty message');
    }

    const message = userMessage.toLowerCase().trim();
    
    // Step 1: Keyword-based detection
    const keywordResults = this.detectByKeywords(message);
    
    // Step 2: Context-based boosting
    const boostedResults = this.applyContextBoosts(keywordResults, message, context);
    
    // Step 3: Apply negative keywords
    const filteredResults = this.applyNegativeKeywords(boostedResults, message);
    
    // Step 4: Get best match
    const bestMatch = this.getBestMatch(filteredResults);
    
    // Step 5: Check confidence threshold
    if (bestMatch.confidence < this.config.confidenceThreshold) {
      return this.createResult(
        this.config.fallbackAgent,
        bestMatch.confidence,
        `Low confidence (${(bestMatch.confidence * 100).toFixed(1)}%) - routing to primary agent`,
        {
          suggestedAgent: bestMatch.agentId,
          allScores: filteredResults
        }
      );
    }
    
    return this.createResult(
      bestMatch.agentId,
      bestMatch.confidence,
      `Matched with ${(bestMatch.confidence * 100).toFixed(1)}% confidence`,
      {
        matchedKeywords: bestMatch.matchedKeywords,
        allScores: filteredResults
      }
    );
  }

  /**
   * Detect intent using keyword matching
   */
  detectByKeywords(message) {
    const results = {};
    const weights = this.config.keywordWeights;

    // Check each agent's keywords
    for (const [agentId, agentKeywords] of Object.entries(this.config.keywords)) {
      let score = 0;
      const matchedKeywords = [];

      // Check primary keywords (higher weight)
      for (const keyword of agentKeywords.primary) {
        if (message.includes(keyword.toLowerCase())) {
          score += weights.primary;
          matchedKeywords.push({ keyword, type: 'primary' });
        }
      }

      // Check secondary keywords (lower weight)
      for (const keyword of agentKeywords.secondary) {
        if (message.includes(keyword.toLowerCase())) {
          score += weights.secondary;
          matchedKeywords.push({ keyword, type: 'secondary' });
        }
      }

      if (matchedKeywords.length > 0) {
        results[agentId] = {
          agentId,
          score,
          matchedKeywords,
          confidence: 0 // Will be calculated later
        };
      }
    }

    // Calculate confidence scores (normalize)
    const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
    
    if (totalScore > 0) {
      for (const agentId in results) {
        results[agentId].confidence = Math.min(
          results[agentId].score / totalScore,
          this.config.maxConfidence
        );
      }
    }

    return results;
  }

  /**
   * Apply context-based confidence boosts
   */
  applyContextBoosts(results, message, context) {
    const boostedResults = { ...results };

    // Apply context hints
    for (const [hint, agentId] of Object.entries(this.config.contextHints)) {
      if (message.includes(hint)) {
        if (boostedResults[agentId]) {
          boostedResults[agentId].confidence *= 1.2; // 20% boost
          boostedResults[agentId].score *= 1.2;
        } else {
          // Create entry if context hint is strong
          boostedResults[agentId] = {
            agentId,
            score: 0.5,
            matchedKeywords: [{ keyword: hint, type: 'context' }],
            confidence: 0.5
          };
        }
      }
    }

    // Normalize confidence scores again
    const maxConfidence = Math.max(
      ...Object.values(boostedResults).map(r => r.confidence),
      0.01
    );
    
    for (const agentId in boostedResults) {
      boostedResults[agentId].confidence = Math.min(
        boostedResults[agentId].confidence / maxConfidence,
        this.config.maxConfidence
      );
    }

    return boostedResults;
  }

  /**
   * Apply negative keywords to reduce confidence
   */
  applyNegativeKeywords(results, message) {
    const filteredResults = { ...results };

    for (const [agentId, negKeywords] of Object.entries(this.config.negativeKeywords)) {
      if (!filteredResults[agentId]) continue;

      for (const negKeyword of negKeywords) {
        if (message.includes(negKeyword.toLowerCase())) {
          // Reduce confidence by 30% for each negative keyword match
          filteredResults[agentId].confidence *= 0.7;
          filteredResults[agentId].score *= 0.7;
        }
      }
    }

    return filteredResults;
  }

  /**
   * Get the best matching agent
   */
  getBestMatch(results) {
    if (Object.keys(results).length === 0) {
      return {
        agentId: this.config.fallbackAgent,
        confidence: 0,
        matchedKeywords: []
      };
    }

    // Sort by confidence
    const sorted = Object.values(results).sort((a, b) => b.confidence - a.confidence);
    
    // Check if there's a tie
    const topScore = sorted[0].confidence;
    const topMatches = sorted.filter(r => Math.abs(r.confidence - topScore) < 0.01);

    if (topMatches.length > 1) {
      // Use priority order to break tie
      for (const priorityAgent of this.config.priorityOrder) {
        const match = topMatches.find(m => m.agentId === priorityAgent);
        if (match) return match;
      }
    }

    return sorted[0];
  }

  /**
   * Create a standardized detection result
   */
  createResult(agentId, confidence, reason, metadata = {}) {
    const result = {
      agentId,
      confidence: Math.min(Math.max(confidence, 0), 1), // Clamp between 0 and 1
      reason,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    // Log if enabled
    if (this.config.logging.logAllRoutingDecisions) {
      console.log('🎯 Routing Decision:', {
        agent: agentId,
        confidence: `${(confidence * 100).toFixed(1)}%`,
        reason
      });
    }

    return result;
  }

  /**
   * Get routing decision explanation (for debugging/transparency)
   */
  explainDecision(userMessage, context = {}) {
    const result = this.detect(userMessage, context);
    const agent = getSubAgent(result.agentId);

    return {
      userMessage,
      routedTo: {
        id: result.agentId,
        name: agent?.name || 'Sarah (Primary Agent)',
        role: agent?.role || 'General Consultation'
      },
      confidence: `${(result.confidence * 100).toFixed(1)}%`,
      reason: result.reason,
      matchedKeywords: result.matchedKeywords || [],
      allScores: result.allScores || {},
      timestamp: result.timestamp
    };
  }

  /**
   * Batch detect intents for multiple messages (for testing)
   */
  detectBatch(messages) {
    return messages.map(msg => ({
      message: msg,
      result: this.detect(msg)
    }));
  }

  /**
   * Get detection statistics (for monitoring)
   */
  getStats(detections) {
    const stats = {
      total: detections.length,
      byAgent: {},
      avgConfidence: 0,
      lowConfidenceCount: 0
    };

    for (const detection of detections) {
      const agentId = detection.agentId || detection.result?.agentId;
      const confidence = detection.confidence || detection.result?.confidence || 0;

      stats.byAgent[agentId] = (stats.byAgent[agentId] || 0) + 1;
      stats.avgConfidence += confidence;
      
      if (confidence < this.config.confidenceThreshold) {
        stats.lowConfidenceCount++;
      }
    }

    stats.avgConfidence = stats.avgConfidence / stats.total;

    return stats;
  }
}

module.exports = IntentDetector;

