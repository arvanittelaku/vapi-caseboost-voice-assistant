# 🧠 Context Manager Guide - Automatic Context Passing for VAPI Squads

**Complete Implementation Guide for Conversation Memory & Summarization**

---

## 🎯 What This Does

The Context Manager automatically:

1. ✅ **Records every conversation message** (last 20 messages per conversation)
2. ✅ **Generates AI summaries** using OpenAI or Groq
3. ✅ **Passes context to sub-agents** automatically
4. ✅ **Maintains conversation continuity** across agent transfers

---

## 📦 What Was Created

### Core Files

1. **`src/services/context-manager.js`** (350 lines)
   - In-memory conversation storage
   - OpenAI & Groq summarization
   - Automatic context routing

2. **`src/webhooks/context-transfer-webhook.js`** (150 lines)
   - REST API for context operations
   - Endpoints for routing, recording, summaries

3. **`examples/context-manager-usage.js`** (250 lines)
   - 5 complete usage examples
   - Ready-to-run demonstrations

4. **Updated `src/webhooks/vapi-webhook.js`**
   - Automatic message recording from transcripts
   - Integrated context manager

---

## 🚀 Quick Start

### Step 1: Configure Environment Variables

Add to your `.env` file:

```env
# Choose ONE LLM provider (OpenAI recommended)
OPENAI_API_KEY=your-openai-key-here
# OR
GROQ_API_KEY=your-groq-key-here

# LLM Provider (defaults to 'openai')
LLM_PROVIDER=openai  # or 'groq'

# VAPI API Key (already set)
VAPI_API_KEY=c4b1fe40-f188-4a21-b405-91b3119f6a3f
```

**Recommendations:**
- **OpenAI**: `gpt-4o-mini` - Fast, accurate, $0.15/1M input tokens
- **Groq**: `llama-3.3-70b` - Faster, free tier available, great quality

---

### Step 2: Install Dependencies (Already Done)

```bash
npm install axios dotenv express
```

---

### Step 3: Start Your Server

```bash
npm start
```

The context manager is now active and listening on:
- `POST /webhook/context/route-with-context` - Route to sub-agent with context
- `POST /webhook/context/record-message` - Record a message
- `GET /webhook/context/summary/:conversationId` - Get conversation summary
- `GET /webhook/context/memory-stats` - Get memory statistics

---

## 📚 Usage Examples

### Example 1: Basic Message Recording

```javascript
const contextManager = require('./src/services/context-manager');

const conversationId = 'conv_12345';

// Record user message
contextManager.addMessage(conversationId, 'user', 
  "I'm Dr. Chen from Chen Medical. We need immediate qualified leads.",
  { source: 'phone-call' }
);

// Record assistant message
contextManager.addMessage(conversationId, 'assistant',
  "Great! Let me connect you with Paula, our lead delivery specialist.",
  { agentName: 'Sarah' }
);

// Get conversation history
const history = contextManager.getConversationHistory(conversationId, 10);
console.log(`Recorded ${history.length} messages`);
```

---

### Example 2: Generate Summary

```javascript
const contextManager = require('./src/services/context-manager');

const conversationId = 'conv_12345';
const history = contextManager.getConversationHistory(conversationId);

// Generate AI summary (3-5 sentences)
const summary = await contextManager.generateSummary(history);

console.log('Summary:', summary);
// Output: "Dr. Chen from Chen Medical contacted CaseBoost seeking immediate 
//          qualified leads. The firm specializes in medical malpractice and 
//          is located in Los Angeles. Sarah qualified the lead and is 
//          transferring to Paula for lead delivery discussion."
```

---

### Example 3: Route to Sub-Agent with Context

```javascript
const contextManager = require('./src/services/context-manager');

// Automatically fetches history, generates summary, and prepares transfer
const result = await contextManager.routeToSubAgent(
  'paula',              // Sub-agent name
  'conv_12345',         // Conversation ID
  {                     // Additional context (optional)
    firmType: 'medical malpractice',
    urgency: 'immediate'
  }
);

if (result.success) {
  console.log('Context Summary:', result.contextSummary);
  console.log('Target Agent:', result.agentName);
  console.log('Agent ID:', result.agentId);
}
```

**Output:**
```
═══════════════════════════════════════════════════════
🔄 ROUTING TO SUB-AGENT: PAULA
═══════════════════════════════════════════════════════

📚 Step 1: Fetching conversation history...
✅ Retrieved 4 messages for conversation conv_12345

🤖 Step 2: Generating context summary...
✅ Summary generated: "Dr. Chen from Chen Medical contacted..."

📤 Transferring to paula (ID: 8c09f5c7-c1f8-4015-b632-19b51456b522)
   Context: "Dr. Chen from Chen Medical contacted..."

✅ Transfer prepared successfully!
```

---

### Example 4: REST API Usage (from Frontend/External)

#### Route to Sub-Agent

```bash
curl -X POST http://localhost:3000/webhook/context/route-with-context \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "paula",
    "conversationId": "conv_12345",
    "message": {
      "role": "user",
      "content": "We need 20-30 leads per month"
    },
    "additionalContext": {
      "firmType": "medical malpractice",
      "urgency": "immediate"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "transfer": {
    "targetAgent": "paula",
    "targetAgentId": "8c09f5c7-c1f8-4015-b632-19b51456b522",
    "contextSummary": "Dr. Chen from Chen Medical, a medical malpractice firm, contacted CaseBoost seeking 20-30 immediate qualified leads per month.",
    "conversationId": "conv_12345"
  },
  "vapiPayload": {
    "assistantId": "8c09f5c7-c1f8-4015-b632-19b51456b522",
    "context": {
      "conversationSummary": "Dr. Chen from Chen Medical...",
      "conversationId": "conv_12345",
      "timestamp": "2024-10-17T10:30:00.000Z",
      "firmType": "medical malpractice",
      "urgency": "immediate"
    }
  }
}
```

#### Get Conversation Summary

```bash
curl http://localhost:3000/webhook/context/summary/conv_12345?limit=10
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_12345",
  "summary": "Dr. Chen from Chen Medical contacted CaseBoost...",
  "messageCount": 4,
  "messages": [...]
}
```

#### Get Memory Stats

```bash
curl http://localhost:3000/webhook/context/memory-stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalConversations": 5,
    "totalMessages": 32,
    "averageMessagesPerConversation": "6.40",
    "maxMessagesPerConversation": 20
  },
  "timestamp": "2024-10-17T10:30:00.000Z"
}
```

---

## 🔄 Integration with VAPI Webhook

### Automatic Recording (Already Integrated)

Your VAPI webhook now **automatically records** conversation messages from transcripts:

```javascript
// src/webhooks/vapi-webhook.js
async handleTranscript(call) {
  // Automatically records messages to context manager
  if (call.transcript && call.id) {
    const messages = call.transcript.split('\n');
    messages.forEach(msg => {
      const isUser = msg.startsWith('User:');
      const role = isUser ? 'user' : 'assistant';
      const content = msg.replace(/^(User|Assistant):\s*/, '');
      
      this.contextManager.addMessage(call.id, role, content, {
        agentName: isUser ? 'User' : 'Sarah',
        callId: call.id,
        source: 'vapi-transcript'
      });
    });
  }
}
```

**Result:** All VAPI calls are automatically recorded in memory!

---

## 🎯 How to Use in Your Main Agent (Sarah)

### Option 1: Via Function Call (Recommended)

Update Sarah's system prompt to include a function for context-aware transfer:

```javascript
// In Sarah's configuration
{
  "functions": [
    {
      "name": "transfer_with_context",
      "description": "Transfer to specialist with automatic context passing",
      "parameters": {
        "type": "object",
        "properties": {
          "specialist": {
            "type": "string",
            "enum": ["paula", "alex", "peter", "patricia"]
          },
          "reason": {
            "type": "string"
          }
        }
      },
      "server": {
        "url": "https://your-server.com/webhook/context/route-with-context",
        "method": "POST"
      }
    }
  ]
}
```

### Option 2: Via Your Backend

When Sarah decides to transfer, call your backend:

```javascript
// In your routing logic
async function handleSarahTransferDecision(conversationId, targetAgent) {
  const result = await contextManager.routeToSubAgent(
    targetAgent,
    conversationId
  );
  
  if (result.success) {
    // Use result.payload to make the actual VAPI transfer call
    await vapiClient.transferCall(result.agentId, {
      context: result.contextSummary
    });
  }
}
```

---

## 🧪 Testing the System

### Run the Examples

```bash
node examples/context-manager-usage.js
```

This runs 5 demonstrations:
1. Basic message recording
2. Summary generation
3. Sub-agent routing
4. Full workflow (Sarah → Patricia)
5. Memory statistics

Expected output:
```
╔═══════════════════════════════════════════════════════╗
║   CONTEXT MANAGER - EXAMPLE USAGE DEMONSTRATIONS      ║
╚═══════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════
📝 EXAMPLE 1: Basic Message Recording
═══════════════════════════════════════════════════════

📝 Message added to conversation conv_12345:
   - Role: assistant
   - Content: Hi! This is Sarah from CaseBoost...
   - Total Messages: 1

...

╔═══════════════════════════════════════════════════════╗
║              ✅ ALL EXAMPLES COMPLETED                ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🔧 Advanced Configuration

### Adjust Memory Limits

```javascript
// In context-manager.js constructor
this.maxMessagesPerConversation = 20;  // Change to 50, 100, etc.
```

### Switch LLM Provider

```env
# In .env
LLM_PROVIDER=groq  # Switch from OpenAI to Groq
GROQ_API_KEY=your-groq-key
```

### Customize Summary Prompt

```javascript
// In generateSummary() method
{
  role: 'system',
  content: 'Your custom prompt here...'
}
```

---

## 📊 API Reference

### ContextManager Methods

#### `addMessage(conversationId, role, content, metadata)`
Records a message in conversation memory.

**Parameters:**
- `conversationId` (string): Unique conversation identifier
- `role` (string): 'user' or 'assistant'
- `content` (string): Message content
- `metadata` (object, optional): Additional data (agentName, source, etc.)

**Returns:** Message object

---

#### `getConversationHistory(conversationId, limit=10)`
Retrieves recent messages from a conversation.

**Parameters:**
- `conversationId` (string): Conversation identifier
- `limit` (number, optional): Number of messages to retrieve (default: 10)

**Returns:** Array of message objects

---

#### `generateSummary(messages)`
Generates an AI summary of conversation messages.

**Parameters:**
- `messages` (array): Array of message objects

**Returns:** Promise<string> - Summary (3-5 sentences)

---

#### `routeToSubAgent(agentName, conversationId, additionalContext)`
Routes to a sub-agent with automatic context passing.

**Parameters:**
- `agentName` (string): 'paula', 'alex', 'peter', or 'patricia'
- `conversationId` (string): Conversation identifier
- `additionalContext` (object, optional): Extra context to pass

**Returns:** Promise<object> - Transfer result with contextSummary and payload

---

#### `clearConversation(conversationId)`
Clears conversation memory.

**Parameters:**
- `conversationId` (string): Conversation to clear

**Returns:** boolean - Success status

---

#### `getMemoryStats()`
Returns memory usage statistics.

**Returns:** Object with totalConversations, totalMessages, etc.

---

## 🎯 Real-World Usage Scenario

### Scenario: Sarah → Paula Transfer

**1. User calls, talks to Sarah:**
```
User: "Hi, I'm Dr. Chen from Chen Medical"
Sarah: "Nice to meet you! What brings you here?"
User: "We need immediate qualified leads for medical malpractice"
```

**2. VAPI automatically records messages** (via transcript webhook)

**3. Sarah decides to transfer:**
```javascript
// In Sarah's logic
await contextManager.routeToSubAgent('paula', call.id, {
  practiceArea: 'medical malpractice',
  urgency: 'immediate'
});
```

**4. Context Manager:**
- Fetches last 10 messages
- Generates summary: "Dr. Chen from Chen Medical, a medical malpractice firm, is seeking immediate qualified leads."
- Prepares transfer payload

**5. Paula receives context:**
```
Paula: "Hi Dr. Chen! Sarah mentioned you're from Chen Medical and need 
       immediate qualified leads for medical malpractice. Let's discuss 
       your monthly case volume goals..."
```

**Result:** Seamless transfer with full context! 🎉

---

## 🚨 Troubleshooting

### Issue: "No LLM API key configured"

**Solution:** Add to `.env`:
```env
OPENAI_API_KEY=your-key-here
```

---

### Issue: Summary generation fails

**Solution:** Check your LLM provider status and API key. Try switching:
```env
LLM_PROVIDER=groq  # Switch to Groq if OpenAI fails
```

---

### Issue: Messages not being recorded

**Check:**
1. Is VAPI sending transcript webhooks? Check logs
2. Is the conversation ID consistent?
3. Is the webhook handler running?

---

### Issue: Context not passed to sub-agent

**Check:**
1. Are you calling `routeToSubAgent()` before the transfer?
2. Is the sub-agent ID correct?
3. Check the transfer payload in logs

---

## 📈 Performance & Scalability

### Current Implementation (In-Memory)

- ✅ **Fast:** No database queries
- ✅ **Simple:** Easy to understand and debug
- ⚠️ **Limited:** Lost on server restart
- ⚠️ **Not suitable for production at scale**

### Recommended for Production

**Phase 1:** Redis (for persistence)
```bash
npm install redis ioredis
```

**Phase 2:** Database (PostgreSQL, MongoDB)
- Store full conversation history
- Query past conversations
- Analytics and reporting

**Phase 3:** Vector Database (Pinecone, Supabase)
- Semantic search across conversations
- Long-term memory
- AI-powered insights

---

## 🎓 Next Steps

### Immediate (Ready Now)
1. ✅ Test with examples: `node examples/context-manager-usage.js`
2. ✅ Make a real VAPI call and check context preservation
3. ✅ Monitor memory stats during conversations

### Short-Term (This Week)
1. Add Redis for persistence
2. Implement conversation cleanup (delete old conversations)
3. Add vector embeddings for semantic search

### Long-Term (Production)
1. Move to database storage
2. Add analytics dashboard
3. Implement RAG (Retrieval Augmented Generation) for long-term memory

---

## ✅ Summary

You now have:

1. ✅ **Automatic conversation recording** from VAPI transcripts
2. ✅ **AI-powered summarization** using OpenAI/Groq
3. ✅ **Context-aware routing** to sub-agents
4. ✅ **REST API** for external integrations
5. ✅ **Complete examples** ready to run
6. ✅ **In-memory storage** (last 20 messages per conversation)

**Ready to use!** Just add your `OPENAI_API_KEY` and start testing! 🚀

