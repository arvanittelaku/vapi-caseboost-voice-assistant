# 🚀 SUB-AGENTS DEPLOYMENT GUIDE
## CaseBoost Voice Assistant - Phase 1 Implementation

**Last Updated:** October 17, 2024  
**Status:** Ready for Deployment  
**Estimated Deployment Time:** 30 minutes

---

## 📋 WHAT WAS IMPLEMENTED

### ✅ Complete Sub-Agent System

**4 Specialized Sub-Agents:**
1. **Paula** - Performance Lead Delivery Specialist
2. **Alex** - AI Sales & Intake Specialist  
3. **Peter** - PPC Specialist
4. **Patricia** - Practice Area Consultant

**Core Infrastructure:**
- ✅ Intent detection engine with keyword matching + confidence scoring
- ✅ Sub-agent router with context preservation
- ✅ Webhook endpoint for VAPI integration
- ✅ Comprehensive testing suite
- ✅ Analytics and monitoring capabilities

---

## 🎯 HOW IT WORKS

```
User Call → VAPI Assistant (Sarah)
    ↓
Sarah detects service interest
    ↓
Calls route_to_specialist function
    ↓
Your Webhook: /webhook/sub-agent/route-sub-agent
    ↓
Intent Detector analyzes message
    ↓
Sub-Agent Router returns specialist config
    ↓
VAPI injects specialist's system message & greeting
    ↓
Conversation continues with specialist persona
```

**Key Insight:** It's still ONE VAPI assistant, but Sarah dynamically becomes a specialist based on the conversation.

---

## 📦 WHAT'S IN YOUR PROJECT NOW

```
vapi-caseboost-voice-assistant/
├─ src/
│  ├─ config/
│  │  ├─ assistant-config.js          ← UPDATED: Added route_to_specialist function
│  │  ├─ routing-config.js            ← NEW: Keyword mappings & rules
│  │  └─ sub-agents/
│  │     ├─ index.js                  ← NEW: Sub-agent registry
│  │     ├─ paula-performance-leads.js ← NEW: Paula's config
│  │     ├─ alex-ai-intake.js         ← NEW: Alex's config
│  │     ├─ peter-ppc.js              ← NEW: Peter's config
│  │     └─ patricia-practice-areas.js ← NEW: Patricia's config
│  ├─ services/
│  │  ├─ intent-detector.js           ← NEW: Detects user intent
│  │  └─ sub-agent-router.js          ← NEW: Routes to sub-agents
│  └─ webhooks/
│     ├─ vapi-webhook.js              ← UPDATED: Added sub-agent routes
│     └─ sub-agent-webhook.js         ← NEW: Routing endpoint
├─ scripts/
│  └─ test-sub-agents.js              ← NEW: Testing suite
├─ package.json                        ← UPDATED: Added test scripts
└─ docs/
   ├─ SUB-AGENTS-IMPLEMENTATION-PLAN.md    (Research & planning)
   ├─ SUB-AGENTS-IMPLEMENTATION-FINAL.md   (Production design)
   └─ SUB-AGENTS-DEPLOYMENT-GUIDE.md       (This file)
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Test Locally (5 minutes)

```bash
# Install dependencies (if needed)
npm install

# Test sub-agent routing
npm run test-sub-agents

# Test intent detection
npm run test-intent

# Test routing logic
npm run test-routing
```

**Expected Output:**
```
📊 Testing Intent Detection...
✅ Performance lead delivery
✅ After-hours coverage
✅ Google Ads inquiry
...
📈 Intent Detection Results: 13 passed, 0 failed (100% accuracy)
```

---

### Step 2: Start Your Server (2 minutes)

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

**Expected Output:**
```
🚀 CaseBoost webhook server running on port 3000
📡 Webhook endpoints:
   - VAPI: http://localhost:3000/webhook/vapi
   - Sub-Agent Routing: http://localhost:3000/webhook/sub-agent/route-sub-agent
   - Sub-Agent Explain: http://localhost:3000/webhook/sub-agent/explain-routing
   - Sub-Agent Stats: http://localhost:3000/webhook/sub-agent/routing-stats
   ...
🤖 Sub-Agents Active: Paula, Alex, Peter, Patricia
```

---

### Step 3: Expose with ngrok (3 minutes)

```bash
# In a new terminal
ngrok http 3000
```

**Copy the HTTPS URL** (e.g., `https://abcd1234.ngrok.io`)

---

### Step 4: Configure VAPI Assistant (10 minutes)

#### A. Add the `route_to_specialist` Function

Go to your VAPI dashboard → Your Assistant → Functions → Add Function

**Function Configuration:**
```json
{
  "type": "function",
  "function": {
    "name": "route_to_specialist",
    "description": "Route conversation to a specialized sub-agent based on service interest. Call this when you detect specific service needs.",
    "url": "https://YOUR-NGROK-URL.ngrok.io/webhook/sub-agent/route-sub-agent",
    "method": "POST",
    "parameters": {
      "type": "object",
      "properties": {
        "userMessage": {
          "type": "string",
          "description": "The user's complete message"
        },
        "conversationId": {
          "type": "string",
          "description": "Current conversation ID"
        },
        "metadata": {
          "type": "object",
          "description": "Additional context"
        }
      },
      "required": ["userMessage"]
    }
  }
}
```

**Replace `YOUR-NGROK-URL` with your actual ngrok URL!**

#### B. Update Sarah's System Message

Add this to Sarah's existing system message (at the beginning):

```
IMPORTANT: When you detect that the prospect is interested in a specific service, call the route_to_specialist function with their message. This will connect them with a specialist who can provide expert guidance.

Service routing triggers:
- Performance lead delivery (immediate leads, buy leads) → Call route_to_specialist
- AI intake automation (24/7, automation, chatbot) → Call route_to_specialist  
- PPC advertising (Google Ads, paid ads, PPC) → Call route_to_specialist
- Practice area questions (medical malpractice, personal injury, immigration, family law) → Call route_to_specialist

After calling route_to_specialist, the conversation will transition to the specialist. Continue naturally.
```

---

### Step 5: Test with a Real Call (5 minutes)

#### Test Scenario 1: Performance Leads
```bash
npm run test-vapi-call +YOUR_PHONE_NUMBER
```

**Say:** "We need immediate qualified leads for personal injury"

**Expected:** Sarah routes to Paula, who introduces herself as the Performance Lead Delivery specialist.

#### Test Scenario 2: AI Intake
**Say:** "We're missing calls after hours and need automation"

**Expected:** Sarah routes to Alex, who introduces himself as the AI Intake specialist.

#### Test Scenario 3: PPC
**Say:** "We want to run Google Ads for our law firm"

**Expected:** Sarah routes to Peter, who introduces himself as the PPC specialist.

#### Test Scenario 4: Practice Area
**Say:** "We're a medical malpractice firm looking to grow"

**Expected:** Sarah routes to Patricia, who introduces herself as the Practice Area consultant.

---

### Step 6: Monitor & Verify (5 minutes)

#### Check Routing Stats
```bash
# In browser or curl
curl http://localhost:3000/webhook/sub-agent/routing-stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalConversations": 4,
    "totalRoutingEvents": 4,
    "agentDistribution": {
      "paula": 1,
      "alex": 1,
      "peter": 1,
      "patricia": 1
    },
    "avgConfidence": 0.85
  }
}
```

#### Check Server Logs
Look for these logs after each call:
```
🎯 Routing request received: ...
✅ Routed to Paula (85.3% confidence)
```

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Performance Leads (Paula)
**Test Messages:**
- "We need immediate qualified leads"
- "Can we buy pre-qualified personal injury leads?"
- "How much do performance leads cost?"

**Expected:** Routes to Paula with 80%+ confidence

### Scenario 2: AI Intake (Alex)
**Test Messages:**
- "We're missing calls after hours"
- "Can you automate our intake with AI?"
- "We need 24/7 lead capture"

**Expected:** Routes to Alex with 80%+ confidence

### Scenario 3: PPC (Peter)
**Test Messages:**
- "We want to run Google Ads"
- "What's your PPC management fee?"
- "Can you help with Facebook advertising?"

**Expected:** Routes to Peter with 80%+ confidence

### Scenario 4: Practice Areas (Patricia)
**Test Messages:**
- "We're a medical malpractice firm"
- "How do personal injury firms get clients?"
- "What's the average immigration case value?"

**Expected:** Routes to Patricia with 80%+ confidence

### Scenario 5: General/Ambiguous (Sarah)
**Test Messages:**
- "Tell me about your company"
- "We need help with everything"
- "How much does it cost?"

**Expected:** Stays with Sarah (primary agent)

---

## 📊 MONITORING & ANALYTICS

### Real-Time Routing Stats
```bash
# View routing statistics
curl http://localhost:3000/webhook/sub-agent/routing-stats
```

### Explain Routing Decision
```bash
# Test routing explanation
curl -X POST http://localhost:3000/webhook/sub-agent/explain-routing \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "We need immediate leads for PI cases"}'
```

**Response:**
```json
{
  "userMessage": "We need immediate leads for PI cases",
  "routedTo": {
    "id": "paula",
    "name": "Paula",
    "role": "Performance Lead Delivery Specialist"
  },
  "confidence": "87.5%",
  "reason": "Matched with 87.5% confidence",
  "matchedKeywords": [
    { "keyword": "immediate leads", "type": "primary" },
    { "keyword": "qualified leads", "type": "primary" }
  ]
}
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: Function Not Being Called

**Symptoms:** Sarah doesn't route to specialists

**Fixes:**
1. Check VAPI function configuration has correct webhook URL
2. Verify ngrok is running and URL is correct
3. Check Sarah's system message includes routing triggers
4. Test webhook manually:
   ```bash
   curl -X POST http://localhost:3000/webhook/sub-agent/route-sub-agent \
     -H "Content-Type: application/json" \
     -d '{"userMessage": "We need immediate leads"}'
   ```

### Issue 2: Wrong Specialist Routed

**Symptoms:** Routes to unexpected specialist

**Fixes:**
1. Check routing confidence in server logs
2. Review keywords in `src/config/routing-config.js`
3. Test with explicit messages:
   ```bash
   npm run test-intent
   ```
4. Adjust keyword weights or add negative keywords

### Issue 3: Low Confidence Routing

**Symptoms:** Always routes to Sarah (fallback)

**Fixes:**
1. Check confidence threshold (default: 0.6 = 60%)
2. Add more keywords for that service in `routing-config.js`
3. Increase keyword weights for primary matches
4. Check server logs for matched keywords

### Issue 4: Context Not Preserved

**Symptoms:** Specialist doesn't reference previous conversation

**Fixes:**
1. Ensure `metadata.conversationSummary` is passed in webhook call
2. Check `buildContextSummary()` in `sub-agent-router.js`
3. Verify VAPI is sending conversation context

---

## 📈 SUCCESS METRICS

Monitor these KPIs after deployment:

### Routing Accuracy
- **Target:** >90% correct routing
- **How to measure:** Review routing logs and feedback

### Routing Confidence
- **Target:** >75% average confidence
- **How to measure:** Check `/routing-stats` endpoint

### Conversation Quality
- **Target:** No information repeated after routing
- **How to measure:** Listen to call recordings

### Conversion Rate
- **Target:** +15-20% vs. before sub-agents
- **How to measure:** Track consultation bookings by agent

---

## 🎉 NEXT STEPS AFTER DEPLOYMENT

### Week 1: Monitor & Tune
- [ ] Review routing logs daily
- [ ] Adjust keywords based on misroutes
- [ ] Collect user feedback on transitions

### Week 2: Optimize
- [ ] Analyze which specialists convert best
- [ ] Refine specialist greetings based on feedback
- [ ] Add more keywords for edge cases

### Week 3: Expand
- [ ] Consider adding more specialists (SEO, Web Design, CRM)
- [ ] Implement LLM fallback for ambiguous cases
- [ ] Add advanced analytics dashboard

### Phase 2 (Future):
- [ ] Multi-turn specialist collaboration
- [ ] Specialist-to-specialist handoffs
- [ ] Advanced memory management
- [ ] A/B testing different specialist personalities

---

## 📞 SUPPORT & QUESTIONS

**Routing Issues:** Check server logs at `npm run dev`
**Testing Help:** Run `npm run test-sub-agents`
**Performance:** Check `/webhook/sub-agent/routing-stats`

---

## ✅ DEPLOYMENT CHECKLIST

Before going live:

- [ ] All tests passing (`npm run test-sub-agents`)
- [ ] Server running (`npm start`)
- [ ] ngrok exposed (HTTPS URL copied)
- [ ] VAPI function configured with correct webhook URL
- [ ] Sarah's system message updated with routing triggers
- [ ] Test call completed successfully
- [ ] Routing logs show correct specialist routing
- [ ] Context preserved across transitions
- [ ] All 4 specialists tested (Paula, Alex, Peter, Patricia)

**Once all checked, you're ready to go live! 🚀**

---

**Estimated Results After 30 Days:**
- 90%+ routing accuracy
- 15-20% increase in consultation bookings
- Better lead qualification
- Higher prospect satisfaction
- Clear data on which specialists convert best

**You now have a production-ready, scalable sub-agent system! 🎯**

