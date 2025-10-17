require('dotenv').config();
const axios = require('axios');

/**
 * ContextManager - Handles conversation memory and context passing between Squad agents
 * 
 * Features:
 * - In-memory conversation storage (last 20 messages per conversation)
 * - Automatic context summarization using OpenAI/Groq
 * - Context passing to sub-agents via VAPI API
 */
class ContextManager {
  constructor() {
    // In-memory store: conversationId -> array of messages
    this.conversationMemory = new Map();
    
    // Maximum messages to keep per conversation
    this.maxMessagesPerConversation = 20;
    
    // OpenAI/Groq configuration
    this.llmProvider = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'groq'
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.vapiApiKey = process.env.VAPI_API_KEY || 'c4b1fe40-f188-4a21-b405-91b3119f6a3f';
    
    // Sub-agent IDs
    this.subAgentIds = {
      paula: '8c09f5c7-c1f8-4015-b632-19b51456b522',
      alex: 'c27cd255-230c-4a00-bd0d-8fb0dd97976a',
      peter: '11a75fe5-0bbf-4c09-99bc-548830cd6af8',
      patricia: 'e3152d1f-4e00-44f3-a5de-5125bbde4cc6'
    };
  }

  /**
   * Add a message to conversation memory
   * @param {string} conversationId - Unique conversation identifier
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   * @param {object} metadata - Additional metadata (agent name, timestamp, etc.)
   */
  addMessage(conversationId, role, content, metadata = {}) {
    try {
      if (!this.conversationMemory.has(conversationId)) {
        this.conversationMemory.set(conversationId, []);
      }

      const messages = this.conversationMemory.get(conversationId);
      
      const message = {
        role,
        content,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      messages.push(message);

      // Keep only the last N messages
      if (messages.length > this.maxMessagesPerConversation) {
        messages.shift(); // Remove oldest message
      }

      console.log(`📝 Message added to conversation ${conversationId}:`, {
        role,
        contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        totalMessages: messages.length
      });

      return message;
    } catch (error) {
      console.error('❌ Error adding message to memory:', error.message);
      throw error;
    }
  }

  /**
   * Get conversation history (last N messages)
   * @param {string} conversationId - Conversation identifier
   * @param {number} limit - Number of messages to retrieve (default: 10)
   * @returns {array} Array of messages
   */
  getConversationHistory(conversationId, limit = 10) {
    try {
      const messages = this.conversationMemory.get(conversationId) || [];
      
      // Return last N messages
      const recentMessages = messages.slice(-limit);
      
      console.log(`📚 Retrieved ${recentMessages.length} messages for conversation ${conversationId}`);
      
      return recentMessages;
    } catch (error) {
      console.error('❌ Error retrieving conversation history:', error.message);
      return [];
    }
  }

  /**
   * Generate a concise summary of conversation history using LLM
   * @param {array} messages - Array of message objects
   * @returns {string} Summary (3-5 sentences)
   */
  async generateSummary(messages) {
    try {
      if (!messages || messages.length === 0) {
        return 'No prior conversation context available.';
      }

      // Format messages for LLM
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : msg.agentName || 'Assistant'}: ${msg.content}`
      ).join('\n');

      console.log(`🤖 Generating summary for ${messages.length} messages using ${this.llmProvider}...`);

      let summary;
      
      if (this.llmProvider === 'groq' && this.groqApiKey) {
        summary = await this.summarizeWithGroq(conversationText);
      } else if (this.openaiApiKey) {
        summary = await this.summarizeWithOpenAI(conversationText);
      } else {
        throw new Error('No LLM API key configured. Set OPENAI_API_KEY or GROQ_API_KEY in .env');
      }

      console.log(`✅ Summary generated: "${summary.substring(0, 100)}..."`);
      
      return summary;
    } catch (error) {
      console.error('❌ Error generating summary:', error.message);
      // Fallback: return a basic summary
      return this.generateFallbackSummary(messages);
    }
  }

  /**
   * Summarize using OpenAI API
   * @param {string} conversationText - Formatted conversation
   * @returns {string} Summary
   */
  async summarizeWithOpenAI(conversationText) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini', // Fast and cost-effective
          messages: [
            {
              role: 'system',
              content: 'You are a conversation summarizer. Create a concise 3-5 sentence summary of the conversation below, focusing on: user\'s name/firm, their main need or problem, key details mentioned, and current conversation stage. Be specific and actionable.'
            },
            {
              role: 'user',
              content: `Summarize this conversation:\n\n${conversationText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('❌ OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Summarize using Groq API (faster, free tier available)
   * @param {string} conversationText - Formatted conversation
   * @returns {string} Summary
   */
  async summarizeWithGroq(conversationText) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile', // Fast and accurate
          messages: [
            {
              role: 'system',
              content: 'You are a conversation summarizer. Create a concise 3-5 sentence summary of the conversation below, focusing on: user\'s name/firm, their main need or problem, key details mentioned, and current conversation stage. Be specific and actionable.'
            },
            {
              role: 'user',
              content: `Summarize this conversation:\n\n${conversationText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('❌ Groq API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate a basic fallback summary if LLM fails
   * @param {array} messages - Message array
   * @returns {string} Basic summary
   */
  generateFallbackSummary(messages) {
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || 'No user input yet';
    
    return `Conversation with ${messages.length} messages. Last user message: "${lastUserMessage.substring(0, 100)}..."`;
  }

  /**
   * Route to a sub-agent with automatic context passing
   * @param {string} agentName - Sub-agent name ('paula', 'alex', 'peter', 'patricia')
   * @param {string} conversationId - Current conversation ID
   * @param {object} additionalContext - Additional context to pass
   * @returns {object} Transfer result
   */
  async routeToSubAgent(agentName, conversationId, additionalContext = {}) {
    try {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log(`🔄 ROUTING TO SUB-AGENT: ${agentName.toUpperCase()}`);
      console.log('═══════════════════════════════════════════════════════\n');

      // Step 1: Get conversation history
      console.log('📚 Step 1: Fetching conversation history...');
      const history = this.getConversationHistory(conversationId, 10);
      
      if (history.length === 0) {
        console.log('⚠️  No conversation history found. Proceeding without context summary.');
      }

      // Step 2: Generate summary
      console.log('🤖 Step 2: Generating context summary...');
      const contextSummary = history.length > 0 
        ? await this.generateSummary(history)
        : 'This is the start of the conversation.';

      console.log(`✅ Context summary: "${contextSummary}"\n`);

      // Step 3: Get sub-agent ID
      const subAgentId = this.subAgentIds[agentName.toLowerCase()];
      
      if (!subAgentId) {
        throw new Error(`Unknown sub-agent: ${agentName}. Available: paula, alex, peter, patricia`);
      }

      // Step 4: Prepare transfer payload
      console.log('📦 Step 3: Preparing transfer payload...');
      const transferPayload = {
        assistantId: subAgentId,
        context: {
          conversationSummary: contextSummary,
          conversationId: conversationId,
          timestamp: new Date().toISOString(),
          ...additionalContext
        }
      };

      console.log(`📤 Transferring to ${agentName} (ID: ${subAgentId})`);
      console.log(`   Context: "${contextSummary.substring(0, 100)}..."\n`);

      // Step 5: Record the transfer in memory
      this.addMessage(conversationId, 'system', 
        `Transferred to ${agentName}. Context: ${contextSummary}`, 
        { 
          type: 'transfer', 
          targetAgent: agentName,
          targetAgentId: subAgentId 
        }
      );

      console.log('✅ Transfer prepared successfully!\n');
      console.log('═══════════════════════════════════════════════════════\n');

      return {
        success: true,
        agentName,
        agentId: subAgentId,
        contextSummary,
        payload: transferPayload,
        message: `Successfully routed to ${agentName} with context`
      };

    } catch (error) {
      console.error('❌ Error routing to sub-agent:', error.message);
      
      return {
        success: false,
        agentName,
        error: error.message,
        message: `Failed to route to ${agentName}`
      };
    }
  }

  /**
   * Clear conversation memory (useful for testing or privacy)
   * @param {string} conversationId - Conversation to clear
   */
  clearConversation(conversationId) {
    if (this.conversationMemory.has(conversationId)) {
      this.conversationMemory.delete(conversationId);
      console.log(`🗑️  Cleared conversation ${conversationId}`);
      return true;
    }
    return false;
  }

  /**
   * Get memory statistics
   * @returns {object} Statistics about memory usage
   */
  getMemoryStats() {
    const totalConversations = this.conversationMemory.size;
    let totalMessages = 0;
    
    for (const messages of this.conversationMemory.values()) {
      totalMessages += messages.length;
    }

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: totalConversations > 0 
        ? (totalMessages / totalConversations).toFixed(2) 
        : 0,
      maxMessagesPerConversation: this.maxMessagesPerConversation
    };
  }
}

// Export singleton instance
module.exports = new ContextManager();

