# ⚡ Context Manager - Quick Start Guide

**Get automatic context passing working in 5 minutes!**

---

## 🎯 What You're Getting

✅ **Automatic conversation memory** (last 20 messages per call)  
✅ **AI-powered summarization** (3-5 sentence summaries)  
✅ **Context passing to sub-agents** (Paula, Alex, Peter, Patricia get the full story)  
✅ **No database required** (in-memory storage for now)

---

## 📋 Prerequisites

- ✅ Node.js installed
- ✅ Your VAPI Squad already configured (Sarah + 4 specialists)
- ✅ OpenAI or Groq API key (for summarization)

---

## 🚀 Step-by-Step Setup

### Step 1: Add API Key to `.env`

Open your `.env` file and add:

```env
# Choose OpenAI (recommended) or Groq
OPENAI_API_KEY=sk-proj-your-key-here

# OR use Groq (faster, free tier)
# GROQ_API_KEY=your-groq-key-here
# LLM_PROVIDER=groq
```

**How to get an API key:**

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env`
4. Cost: ~$0.15 per 1M tokens (very cheap)

**Groq (Alternative):**
1. Go to https://console.groq.com
2. Sign up (free tier available)
3. Get API key
4. Set `LLM_PROVIDER=groq` in `.env`

---

### Step 2: Test the Context Manager

```bash
npm run test-context-manager
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════╗
║   CONTEXT MANAGER - EXAMPLE USAGE DEMONSTRATIONS      ║
╚═══════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════
📝 EXAMPLE 1: Basic Message Recording
═══════════════════════════════════════════════════════

📝 Message added to conversation conv_12345
✅ Recorded 4 messages

═══════════════════════════════════════════════════════
🤖 EXAMPLE 2: Generate Conversation Summary
═══════════════════════════════════════════════════════

🤖 Generating summary for 7 messages using openai...
✅ Summary generated: "Maria Rodriguez from Rodriguez & Associates..."

═══════════════════════════════════════════════════════
🔄 EXAMPLE 3: Route to Sub-Agent with Context
═══════════════════════════════════════════════════════

📚 Step 1: Fetching conversation history...
✅ Retrieved 4 messages

🤖 Step 2: Generating context summary...
✅ Summary generated

📤 Transferring to paula (ID: 8c09f5c7-c1f8-4015-b632-19b51456b522)
✅ Transfer prepared successfully!

... (more examples) ...

╔═══════════════════════════════════════════════════════╗
║              ✅ ALL EXAMPLES COMPLETED                ║
╚═══════════════════════════════════════════════════════╝
```

**If you see this, the Context Manager is working!** ✅

---

### Step 3: Start Your Server

```bash
npm start
```

Your server now has these new endpoints:
- `POST /webhook/context/route-with-context` - Route with context
- `POST /webhook/context/record-message` - Record messages
- `GET /webhook/context/summary/:conversationId` - Get summaries
- `GET /webhook/context/memory-stats` - View statistics

---

### Step 4: Test with a Real Call

Make a VAPI call and check if messages are being recorded:

```bash
# In another terminal, check memory stats
curl http://localhost:3000/webhook/context/memory-stats
```

**Expected response:**
```json
{
  "success": true,
  "stats": {
    "totalConversations": 1,
    "totalMessages": 8,
    "averageMessagesPerConversation": "8.00",
    "maxMessagesPerConversation": 20
  }
}
```

---

## 🧪 How to Use in Your Workflow

### Scenario: Sarah transfers to Paula

**Option A: Programmatically** (in your code)

```javascript
const contextManager = require('./src/services/context-manager');

// When Sarah decides to transfer
const result = await contextManager.routeToSubAgent(
  'paula',           // Target specialist
  call.id,           // Conversation ID from VAPI
  {                  // Additional context (optional)
    practiceArea: 'medical malpractice',
    urgency: 'immediate'
  }
);

console.log('Context Summary:', result.contextSummary);
// "Dr. Chen from Chen Medical needs immediate qualified leads..."
```

**Option B: Via REST API** (from anywhere)

```bash
curl -X POST http://localhost:3000/webhook/context/route-with-context \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "paula",
    "conversationId": "call-xyz-123",
    "additionalContext": {
      "practiceArea": "medical malpractice"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "transfer": {
    "targetAgent": "paula",
    "contextSummary": "Dr. Chen from Chen Medical needs immediate qualified leads for their medical malpractice practice.",
    "conversationId": "call-xyz-123"
  }
}
```

---

## 🎯 What Happens Automatically

### 1. Message Recording

Every time VAPI sends a transcript, messages are automatically recorded:

```
User: "Hi, I'm Dr. Chen"
→ Recorded in memory

Sarah: "Nice to meet you!"
→ Recorded in memory
```

### 2. Context Summarization

When transferring to a sub-agent:

```javascript
// 10 messages in history
await contextManager.routeToSubAgent('paula', call.id);

// Automatically:
// 1. Fetches last 10 messages
// 2. Sends to OpenAI/Groq
// 3. Gets 3-5 sentence summary
// 4. Prepares transfer payload
```

### 3. Sub-Agent Receives Context

Paula now knows:
- User's name (Dr. Chen)
- Firm name (Chen Medical)
- Practice area (medical malpractice)
- Need (qualified leads)
- Urgency (immediate)

**No need to repeat information!** 🎉

---

## 📊 Monitoring & Debugging

### Check Memory Stats

```bash
curl http://localhost:3000/webhook/context/memory-stats
```

### Get Conversation Summary

```bash
curl http://localhost:3000/webhook/context/summary/call-xyz-123
```

### View Logs

The Context Manager logs everything:
```
📝 Message added to conversation call-xyz-123
🤖 Generating summary for 5 messages using openai...
✅ Summary generated: "Dr. Chen from..."
📤 Transferring to paula (ID: 8c09f5c7...)
✅ Transfer prepared successfully!
```

---

## 🚨 Common Issues

### Issue: "No LLM API key configured"

**Fix:** Add to `.env`:
```env
OPENAI_API_KEY=your-key-here
```

Then restart the server:
```bash
npm start
```

---

### Issue: Context Manager test fails

**Check:**
1. Is your API key valid?
2. Do you have internet connection?
3. Is OpenAI/Groq API working? (check their status pages)

**Try switching providers:**
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-key
```

---

### Issue: Messages not being recorded

**Check:**
1. Is your server running? (`npm start`)
2. Is VAPI sending transcripts? (check VAPI dashboard)
3. Are conversation IDs consistent?

**Debug:**
```javascript
const contextManager = require('./src/services/context-manager');

// Manually add a test message
contextManager.addMessage('test-123', 'user', 'Test message');

// Check if it's there
const history = contextManager.getConversationHistory('test-123');
console.log(history); // Should show your message
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `npm run test-context-manager` runs successfully
- [ ] Server starts without errors
- [ ] Memory stats endpoint works
- [ ] Summary generation works (test with examples)
- [ ] VAPI calls are being recorded (check memory stats after a call)

---

## 🎓 Next Steps

### Ready to Use!

1. **Test with real calls:** Make VAPI calls and verify context is preserved
2. **Integrate with Sarah:** Add context passing to your transfer logic
3. **Monitor performance:** Use memory stats to track usage

### Recommended Upgrades (Optional)

**Short-term:**
- Add Redis for persistence across restarts
- Implement conversation cleanup (auto-delete old conversations)

**Long-term:**
- Move to database (PostgreSQL/MongoDB)
- Add vector search for semantic queries
- Build analytics dashboard

---

## 📚 Full Documentation

For complete documentation, see:
- **Full Guide:** `docs/CONTEXT-MANAGER-GUIDE.md`
- **Examples:** `examples/context-manager-usage.js`
- **Architecture Research:** `docs/SQUAD-ARCHITECTURE-RESEARCH.md`

---

## 🎉 That's It!

You now have:
✅ Automatic conversation recording  
✅ AI-powered summarization  
✅ Context-aware routing  

**Ready to test with real calls!** 🚀

---

**Need help?** Check the troubleshooting section in `CONTEXT-MANAGER-GUIDE.md` or the example usage in `examples/context-manager-usage.js`.

