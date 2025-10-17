# 🚀 SQUAD IMPLEMENTATION - DETAILED STEP-BY-STEP GUIDE

**Objective:** Implement VAPI Squads with 5 assistants (Sarah + 4 specialists)  
**Time Required:** 2-3 hours  
**Difficulty:** Moderate  
**Result:** Professional multi-agent voice assistant system

---

## 📋 PREREQUISITES

Before starting, ensure you have:

- [ ] Access to VAPI Dashboard (https://dashboard.vapi.ai)
- [ ] Your VAPI API key
- [ ] Current assistant ID for Sarah
- [ ] All 4 specialist configuration files ready
- [ ] 2-3 hours of uninterrupted time

---

## 🎯 PHASE 1: CREATE SPECIALIST ASSISTANTS IN VAPI (60 minutes)

### Step 1.1: Prepare Specialist System Messages

First, let's extract the system messages from our config files.

**Action:** Open each file and copy the system message:

#### Paula (Performance Lead Delivery Specialist)

**File to read:** `src/config/sub-agents/paula-performance-leads.js`

**What to copy:**

```javascript
You are Paula, an expert in performance lead delivery for legal firms at CaseBoost. Your goal is to explain how CaseBoost delivers pre-qualified, ready-to-close legal inquiries directly to law firms. Be concise, factual, and provide details on lead quality, delivery process, and performance-based pricing. Emphasize no setup required and immediate results.

Key information:
- Service: Instant Qualified Leads (Performance Lead Delivery)
- Model: Pay-per-qualified-lead
- Delivery: Daily, pre-screened, ready-to-close prospects
- Benefits: No setup, immediate volume growth, quality guarantee
- Metrics: Focus on cost-per-lead, close rate, lead quality score.

When asked about pricing, state it's performance-based, clients only pay for results, and we can discuss specific per-lead costs during a consultation.
```

---

#### Alex (AI Sales & Intake Specialist)

**File to read:** `src/config/sub-agents/alex-ai-intake.js`

**What to copy:**

```javascript
You are Alex, an AI Sales & Intake Specialist at CaseBoost. Your goal is to explain the benefits and functionality of CaseBoost's AI Sales & Intake Agents. Be clear, technical yet accessible, and emphasize 24/7 availability, rapid response times, and high conversion rates.

Key information:
- Service: AI Sales & Intake Agents
- Features: 24/7 automated lead qualification, <30 second response time, intelligent follow-up, case booking automation.
- Benefits: Never miss a lead, increased capture rate, improved conversion (40%+ uplift).
- Integration: Seamless with CRM (GoHighLevel), calendars, and case management systems.
- Customization: Tailored conversation flows and qualification criteria.

When discussing integration, mention GoHighLevel specifically.
```

---

#### Peter (PPC Specialist)

**File to read:** `src/config/sub-agents/peter-ppc.js`

**What to copy:**

```javascript
You are Peter, a PPC Specialist at CaseBoost. Your goal is to explain CaseBoost's PPC (Pay-Per-Click) advertising services for law firms. Provide recommendations for platforms (Google Ads, Meta, YouTube), discuss budget considerations, and highlight expected KPIs and ROI.

Key information:
- Service: PPC for Law Firms
- Platforms: Google Ads, Meta (Facebook/Instagram), YouTube
- Focus: High-intent legal keywords, local service ads, remarketing
- Performance: 3.2x average ROAS (Return on Ad Spend), 24% CTR, £2.40 avg CPC
- Strategy: Conversion-focused campaigns tailored to specific practice areas.

When discussing budget, provide ranges and explain how it impacts reach and results.
```

---

#### Patricia (Practice Area Consultant)

**File to read:** `src/config/sub-agents/patricia-practice-areas.js`

**What to copy:**

```javascript
You are Patricia, an expert consultant on legal practice areas at CaseBoost. Your goal is to provide deep insights into specific legal fields that CaseBoost specializes in. Discuss average case values, client acquisition challenges, and ethical considerations relevant to each practice area.

Key information:
- Specializes in high-value practice areas: Medical Malpractice (£250K+ avg), Immigration Law (£15K+ avg), Personal Injury (£25K+ avg), Divorce & Family Law (£12K+ avg).
- Provide context-specific client acquisition tips.
- Address ethical marketing considerations for each area.

Always ask clarifying questions to understand the prospect's specific needs within a practice area.
```

---

### Step 1.2: Create Paula in VAPI Dashboard

**Time:** 15 minutes

#### A. Navigate to VAPI Dashboard

1. Open your browser
2. Go to: https://dashboard.vapi.ai
3. Log in with your credentials
4. Click on **"Assistants"** in the left sidebar

#### B. Create New Assistant

1. Click the **"+ New Assistant"** button (top right)
2. A modal will appear

#### C. Configure Paula's Basic Settings

**Fill in the form:**

| Field             | Value                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**          | `Paula - Performance Leads`                                                                                                                                                                                                                                                                |
| **First Message** | `Hi! I'm Paula, CaseBoost's Performance Lead Delivery specialist. Sarah mentioned you're interested in getting qualified leads delivered directly to your firm. I'd love to learn about your practice area and monthly case volume goals. What type of cases are you primarily taking on?` |

#### D. Configure Paula's Model Settings

Scroll down to **"Model"** section:

| Field              | Value                                        |
| ------------------ | -------------------------------------------- |
| **Provider**       | `OpenAI`                                     |
| **Model**          | `gpt-4` or `gpt-4-turbo`                     |
| **Temperature**    | `0.7`                                        |
| **System Message** | _Paste Paula's system message from Step 1.1_ |

#### E. Configure Paula's Voice Settings

Scroll to **"Voice"** section:

| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| **Provider** | `VAPI` (or your preferred provider)                      |
| **Voice ID** | `Savannah` (or choose another professional female voice) |

#### F. Configure Paula's Transcriber Settings

Scroll to **"Transcriber"** section:

| Field        | Value      |
| ------------ | ---------- |
| **Provider** | `Deepgram` |
| **Model**    | `nova-2`   |
| **Language** | `en-GB`    |

#### G. Save Paula

1. Scroll to the bottom
2. Click **"Create Assistant"**
3. **IMPORTANT:** Copy Paula's Assistant ID
   - It will look like: `asst_abc123xyz...`
   - Save it in a text file labeled "Paula ID"

---

### Step 1.3: Create Alex in VAPI Dashboard

**Time:** 15 minutes

Repeat the same process as Step 1.2, but with Alex's information:

#### Configuration for Alex:

| Field              | Value                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**           | `Alex - AI Intake`                                                                                                                                                                                                                                                                    |
| **First Message**  | `Hi! I'm Alex, CaseBoost's AI Intake specialist. Sarah mentioned you're interested in automating your client intake. I'd love to understand your current challenges with lead capture and response times. Are you looking for a fully automated setup or a human-AI hybrid approach?` |
| **System Message** | _Paste Alex's system message from Step 1.1_                                                                                                                                                                                                                                           |
| **Voice**          | `Savannah` (or choose a professional voice)                                                                                                                                                                                                                                           |
| **Model**          | `gpt-4` or `gpt-4-turbo`                                                                                                                                                                                                                                                              |
| **Transcriber**    | Deepgram `nova-2`, `en-GB`                                                                                                                                                                                                                                                            |

**Save and copy Alex's Assistant ID**

---

### Step 1.4: Create Peter in VAPI Dashboard

**Time:** 15 minutes

Repeat for Peter:

#### Configuration for Peter:

| Field              | Value                                                                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**           | `Peter - PPC`                                                                                                                                                                                                                                             |
| **First Message**  | `Hi! I'm Peter, CaseBoost's PPC specialist for law firms. Sarah mentioned you're looking into paid advertising. I'd love to understand which practice area you want to advertise for and what your monthly budget looks like. What's your primary focus?` |
| **System Message** | _Paste Peter's system message from Step 1.1_                                                                                                                                                                                                              |
| **Voice**          | `Savannah` (or choose a professional male voice if available)                                                                                                                                                                                             |
| **Model**          | `gpt-4` or `gpt-4-turbo`                                                                                                                                                                                                                                  |
| **Transcriber**    | Deepgram `nova-2`, `en-GB`                                                                                                                                                                                                                                |

**Save and copy Peter's Assistant ID**

---

### Step 1.5: Create Patricia in VAPI Dashboard

**Time:** 15 minutes

Repeat for Patricia:

#### Configuration for Patricia:

| Field              | Value                                                                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**           | `Patricia - Practice Areas`                                                                                                                                                                                                                        |
| **First Message**  | `Hi! I'm Patricia, CaseBoost's Practice Area consultant. Sarah mentioned you have questions about specific legal fields. Which practice area should we focus on — Medical Malpractice, Immigration Law, Personal Injury, or Divorce & Family Law?` |
| **System Message** | _Paste Patricia's system message from Step 1.1_                                                                                                                                                                                                    |
| **Voice**          | `Savannah` (or choose a professional female voice)                                                                                                                                                                                                 |
| **Model**          | `gpt-4` or `gpt-4-turbo`                                                                                                                                                                                                                           |
| **Transcriber**    | Deepgram `nova-2`, `en-GB`                                                                                                                                                                                                                         |

**Save and copy Patricia's Assistant ID**

---

### Step 1.6: Document All Assistant IDs

Create a file to track all IDs:

**Create:** `assistant-ids.txt`

```
Sarah (Primary): asst_YOUR_CURRENT_SARAH_ID
Paula (Performance Leads): asst_PAULA_ID_FROM_STEP_1.2
Alex (AI Intake): asst_ALEX_ID_FROM_STEP_1.3
Peter (PPC): asst_PETER_ID_FROM_STEP_1.4
Patricia (Practice Areas): asst_PATRICIA_ID_FROM_STEP_1.5
```

✅ **Checkpoint:** You should now have 5 assistants total in your VAPI dashboard.

---

## 🔗 PHASE 2: CONFIGURE SARAH WITH TRANSFER CAPABILITY (30 minutes)

### Step 2.1: Update Sarah's System Message

**Action:** Add transfer instructions to Sarah's system message.

#### A. Go to Sarah's Configuration

1. In VAPI Dashboard, click **"Assistants"**
2. Find **Sarah** (your primary assistant)
3. Click on her to open configuration
4. Scroll to **"System Message"** section

#### B. Add Transfer Instructions

**Locate the end of Sarah's current system message** and add:

```
---

IMPORTANT: SPECIALIST ROUTING

When you detect specific service interests, transfer the call to the appropriate specialist:

1. PERFORMANCE LEAD DELIVERY
   - Transfer to Paula when user mentions: "immediate leads", "buy leads", "qualified leads", "performance leads", "lead delivery", "ready to close", "instant leads"
   - Example: "We need immediate qualified leads for our practice"

2. AI INTAKE AUTOMATION
   - Transfer to Alex when user mentions: "AI intake", "automation", "24/7", "after hours", "chatbot", "automated responses", "client capture", "missing calls"
   - Example: "We're missing calls after hours and need automation"

3. PPC ADVERTISING
   - Transfer to Peter when user mentions: "Google Ads", "PPC", "Facebook ads", "Meta ads", "paid advertising", "online ads", "YouTube ads"
   - Example: "We want to run Google Ads for our law firm"

4. PRACTICE AREA CONSULTATION
   - Transfer to Patricia when user asks about: "medical malpractice", "immigration law", "personal injury", "family law", "practice area", "case values", "specific cases"
   - Example: "We're a medical malpractice firm looking to grow"

When transferring, say something like: "Let me connect you with [Specialist Name], our [Specialty] expert who can provide detailed guidance on this."

Always transfer when you detect these interests - the specialists have deep expertise in their areas.
```

#### C. Save Sarah's Updated System Message

1. Scroll to the bottom
2. Click **"Save"** or **"Update Assistant"**

---

### Step 2.2: Add Transfer Function to Sarah

**Action:** Configure Sarah with the `transferCall` tool.

#### A. Navigate to Sarah's Functions/Tools Section

1. Still in Sarah's configuration page
2. Scroll down to **"Functions"** or **"Tools"** section
3. Click **"+ Add Function"** or **"+ Add Tool"**

#### B. Configure Transfer Function

**Note:** The exact interface may vary. Look for "Transfer Call" or "Assistant Transfer" option.

**If VAPI has a built-in Transfer option:**

1. Select **"Transfer Call"** from the function types
2. Configure destinations:

**For Paula:**

- **Destination Type:** Assistant
- **Assistant ID:** `asst_PAULA_ID_FROM_YOUR_LIST`
- **Assistant Name:** `Paula - Performance Leads`
- **Transfer Message:** `Let me connect you with Paula, our Performance Lead Delivery specialist who can help you get qualified cases delivered directly to your firm.`
- **Trigger Keywords:** `immediate leads, buy leads, qualified leads, performance leads, lead delivery`

**For Alex:**

- **Destination Type:** Assistant
- **Assistant ID:** `asst_ALEX_ID_FROM_YOUR_LIST`
- **Assistant Name:** `Alex - AI Intake`
- **Transfer Message:** `I'll connect you with Alex, our AI Intake specialist who designs systems that capture leads around the clock.`
- **Trigger Keywords:** `AI intake, automation, 24/7, after hours, chatbot, automated responses`

**For Peter:**

- **Destination Type:** Assistant
- **Assistant ID:** `asst_PETER_ID_FROM_YOUR_LIST`
- **Assistant Name:** `Peter - PPC`
- **Transfer Message:** `Let me get Peter on the line - he's our PPC specialist for law firms and can discuss your paid advertising strategy.`
- **Trigger Keywords:** `Google Ads, PPC, Facebook ads, paid advertising, online ads`

**For Patricia:**

- **Destination Type:** Assistant
- **Assistant ID:** `asst_PATRICIA_ID_FROM_YOUR_LIST`
- **Assistant Name:** `Patricia - Practice Areas`
- **Transfer Message:** `I'll connect you with Patricia, our Practice Area consultant who specializes in your field.`
- **Trigger Keywords:** `medical malpractice, immigration law, personal injury, family law, practice area`

#### C. Alternative: Manual Transfer Function

**If VAPI doesn't have built-in transfer UI, you may need to add a custom function:**

```json
{
  "type": "function",
  "function": {
    "name": "transfer_to_specialist",
    "description": "Transfer call to a specialist assistant based on user needs",
    "parameters": {
      "type": "object",
      "properties": {
        "specialist": {
          "type": "string",
          "enum": ["paula", "alex", "peter", "patricia"],
          "description": "Which specialist to transfer to"
        },
        "reason": {
          "type": "string",
          "description": "Why this specialist is being contacted"
        }
      },
      "required": ["specialist"]
    }
  },
  "server": {
    "url": "YOUR_WEBHOOK_URL/webhook/transfer",
    "method": "POST"
  }
}
```

**Note:** If you need the webhook approach, let me know and I'll provide the webhook implementation.

#### D. Save Transfer Configuration

1. Click **"Save"** or **"Add Function"**
2. Verify all 4 transfer destinations are configured

---

### Step 2.3: Create or Update Squad Configuration

**Action:** Set up the Squad to manage all 5 assistants.

#### A. Navigate to Squads

1. In VAPI Dashboard left sidebar
2. Look for **"Squads"** or **"Multi-Assistant"** section
3. Click **"+ New Squad"** (if available)

**Note:** If you don't see a "Squads" section, transfers may work directly through the function configuration in Step 2.2. Skip to Step 2.4.

#### B. Configure Squad (if available)

| Field                 | Value                            |
| --------------------- | -------------------------------- |
| **Squad Name**        | `CaseBoost Squad`                |
| **Primary Assistant** | Sarah's Assistant ID             |
| **Member Assistants** | Paula, Alex, Peter, Patricia IDs |
| **Routing Mode**      | `Managed` or `Automatic`         |

#### C. Save Squad Configuration

---

### Step 2.4: Test Transfer Configuration

**Action:** Verify Sarah can see the transfer functions.

1. In Sarah's configuration, look for a **"Test"** or **"Preview"** button
2. Try asking: "We need immediate qualified leads"
3. Check if Sarah mentions transferring to Paula
4. If working, you'll see Sarah acknowledge the need to transfer

✅ **Checkpoint:** Sarah should now have transfer capabilities configured.

---

## 🧪 PHASE 3: TEST EACH SPECIALIST TRANSFER (30 minutes)

### Step 3.1: Prepare for Testing

**Action:** Get ready to make test calls.

#### A. Update Your .env File

Ensure you have:

```env
VAPI_API_KEY=your_api_key_here
VAPI_ASSISTANT_ID=SARAH_ASSISTANT_ID  # Your primary assistant
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
```

#### B. Start Webhook Server (if needed)

```bash
# In your project directory
npm run dev
```

Keep this terminal open.

---

### Step 3.2: Test Transfer to Paula

**Time:** 5 minutes

#### A. Make Test Call

```bash
# In a NEW terminal (keep webhook server running)
npm run test-vapi-call +12132127052
```

#### B. Test Script

When Sarah answers:

**YOU SAY:**

```
"Hi Sarah, we need immediate qualified leads for our personal injury practice."
```

**EXPECTED:**

```
SARAH: "Great! Let me connect you with Paula, our Performance Lead
        Delivery specialist who can help you get qualified cases
        delivered directly to your firm."

[Short pause]

PAULA: "Hi! I'm Paula, CaseBoost's Performance Lead Delivery specialist.
        Sarah mentioned you're interested in getting qualified leads
        delivered directly to your firm. I'd love to learn about your
        practice area and monthly case volume goals. What type of cases
        are you primarily taking on?"
```

#### C. Verify Transfer

✅ **Check:**

- [ ] Sarah detected the keyword "immediate qualified leads"
- [ ] Sarah announced the transfer to Paula
- [ ] Paula's voice/greeting played
- [ ] Paula referenced what Sarah said ("Sarah mentioned...")
- [ ] Context was preserved (Paula knows it's about PI practice)

#### D. Continue Conversation with Paula

**ASK PAULA:**

```
"How much do leads cost for personal injury cases?"
```

**EXPECTED:**
Paula should provide details about performance-based pricing, cost-per-lead models, and offer to discuss specifics in a consultation.

✅ **If this works, proceed to next test. If not, see Troubleshooting section below.**

---

### Step 3.3: Test Transfer to Alex

**Time:** 5 minutes

#### A. Make New Test Call

```bash
npm run test-vapi-call +12132127052
```

#### B. Test Script

**YOU SAY:**

```
"Hi, we're missing calls after hours and need some kind of automation."
```

**EXPECTED:**

```
SARAH: "I'll connect you with Alex, our AI Intake specialist..."

ALEX: "Hi! I'm Alex, CaseBoost's AI Intake specialist. Sarah mentioned
       you're interested in automating your client intake..."
```

#### C. Ask Alex

```
"How fast does your AI respond to leads?"
```

**EXPECTED:**
Alex mentions "<30 second response time" and "24/7 availability"

✅ **Checkpoint:** Alex transfer working?

---

### Step 3.4: Test Transfer to Peter

**Time:** 5 minutes

#### A. Make New Test Call

```bash
npm run test-vapi-call +12132127052
```

#### B. Test Script

**YOU SAY:**

```
"We want to run Google Ads for our law firm."
```

**EXPECTED:**

```
SARAH: "Let me get Peter on the line..."

PETER: "Hi! I'm Peter, CaseBoost's PPC specialist for law firms..."
```

#### C. Ask Peter

```
"What's your average return on ad spend?"
```

**EXPECTED:**
Peter mentions "3.2x average ROAS" and "24% CTR"

✅ **Checkpoint:** Peter transfer working?

---

### Step 3.5: Test Transfer to Patricia

**Time:** 5 minutes

#### A. Make New Test Call

```bash
npm run test-vapi-call +12132127052
```

#### B. Test Script

**YOU SAY:**

```
"We're a medical malpractice firm looking to grow our practice."
```

**EXPECTED:**

```
SARAH: "I'll connect you with Patricia, our Practice Area consultant..."

PATRICIA: "Hi! I'm Patricia, CaseBoost's Practice Area consultant..."
```

#### C. Ask Patricia

```
"What's the average case value for medical malpractice?"
```

**EXPECTED:**
Patricia mentions "£250K+ average case value for medical malpractice"

✅ **Checkpoint:** Patricia transfer working?

---

### Step 3.6: Test Fallback (No Transfer)

**Time:** 5 minutes

#### A. Make Test Call

```bash
npm run test-vapi-call +12132127052
```

#### B. Test Script

**YOU SAY:**

```
"Tell me about your company."
```

**EXPECTED:**

```
SARAH: [Provides general information about CaseBoost]
       [DOES NOT transfer - handles it herself]
```

✅ **Checkpoint:** Sarah handles general questions without transferring?

---

## ✅ PHASE 4: VERIFY AND DOCUMENT (20 minutes)

### Step 4.1: Document Test Results

Create a test results file:

**Create:** `test-results.md`

```markdown
# Squad Transfer Test Results

Date: [TODAY'S DATE]
Tested by: [YOUR NAME]

## Test Summary

| Specialist             | Transfer Triggered? | Context Preserved? | Knowledge Accurate? | Status      |
| ---------------------- | ------------------- | ------------------ | ------------------- | ----------- |
| Paula                  | ✅ / ❌             | ✅ / ❌            | ✅ / ❌             | PASS / FAIL |
| Alex                   | ✅ / ❌             | ✅ / ❌            | ✅ / ❌             | PASS / FAIL |
| Peter                  | ✅ / ❌             | ✅ / ❌            | ✅ / ❌             | PASS / FAIL |
| Patricia               | ✅ / ❌             | ✅ / ❌            | ✅ / ❌             | PASS / FAIL |
| No Transfer (fallback) | ✅ / ❌             | N/A                | ✅ / ❌             | PASS / FAIL |

## Notes

[Add any observations, issues, or improvements needed]

## Next Steps

- [ ] All transfers working correctly
- [ ] Context preservation verified
- [ ] Knowledge accuracy confirmed
- [ ] Ready for production use
```

---

### Step 4.2: Update .env with Squad Info

**Action:** Document your Squad configuration.

Add to `.env`:

```env
# Squad Configuration
SQUAD_NAME=CaseBoost Squad
SARAH_ID=asst_xxx
PAULA_ID=asst_xxx
ALEX_ID=asst_xxx
PETER_ID=asst_xxx
PATRICIA_ID=asst_xxx
```

---

### Step 4.3: Update README

Add Squad information to your README:

```markdown
## Squad Configuration

This project uses VAPI Squads for multi-agent conversations:

- **Sarah** (Primary): General lead qualification and routing
- **Paula**: Performance Lead Delivery specialist
- **Alex**: AI Intake specialist
- **Peter**: PPC Advertising specialist
- **Patricia**: Practice Area consultant

### How Transfers Work

Sarah detects service-specific keywords and transfers to the appropriate specialist. Context is automatically preserved during transfers.
```

---

## 🐛 TROUBLESHOOTING

### Issue: Sarah doesn't transfer

**Symptoms:**

- Sarah answers questions herself
- No mention of specialists
- Transfer never happens

**Solutions:**

1. **Check Sarah's System Message:**

   - Verify transfer instructions were added
   - Make sure keywords are listed clearly

2. **Check Transfer Function Configuration:**

   - Verify all 4 specialists are configured
   - Check Assistant IDs are correct
   - Ensure trigger keywords match what you're saying

3. **Try More Explicit Phrases:**

   - Instead of: "We need leads"
   - Say: "We need immediate qualified leads delivered to our firm"

4. **Check VAPI Logs:**
   - Go to VAPI Dashboard → Calls
   - Find your test call
   - Check the transcript
   - Look for function calls

---

### Issue: Transfer happens but no specialist voice

**Symptoms:**

- Sarah says she's transferring
- Silence or error
- Call might drop

**Solutions:**

1. **Verify Assistant IDs:**

   - Double-check the ID you entered matches the specialist
   - Format should be: `asst_abc123...`

2. **Check Specialist Configuration:**

   - Go to specialist's settings
   - Ensure "First Message" is configured
   - Verify voice settings are correct

3. **Check VAPI Plan:**
   - Some plans may not support Squads
   - Verify your plan includes multi-assistant features

---

### Issue: Context not preserved

**Symptoms:**

- Specialist doesn't know what was discussed
- User has to repeat information
- Specialist asks questions Sarah already asked

**Solutions:**

1. **Check VAPI's Context Settings:**

   - Some versions may require explicit context configuration
   - Look for "Preserve Context" toggle in Squad settings

2. **Update Specialist First Messages:**

   - Make them reference the transfer: "Sarah mentioned you're interested in..."
   - This creates the impression of continuity

3. **Use Metadata:**
   - We may need to pass context via metadata (let me know if needed)

---

### Issue: Wrong specialist transfers

**Symptoms:**

- Say "Google Ads" but get Paula instead of Peter
- Keywords triggering wrong specialist

**Solutions:**

1. **Review Keyword Mappings:**

   - Check for keyword overlap
   - Make keywords more specific

2. **Adjust Sarah's System Message:**

   - Clarify the routing rules
   - Add negative examples

3. **Test with Clearer Phrases:**
   - Use full sentences
   - Be explicit: "I want to discuss Google Ads advertising"

---

## 📊 SUCCESS CRITERIA

Your Squad implementation is successful when:

✅ **All 4 specialists transfer correctly**

- Paula: Immediate leads, buy leads, qualified leads
- Alex: AI intake, automation, 24/7
- Peter: Google Ads, PPC, paid advertising
- Patricia: Practice areas, medical malpractice, etc.

✅ **Context is preserved**

- Specialist knows what was discussed with Sarah
- User doesn't repeat information
- Natural conversation flow

✅ **Knowledge is accurate**

- Each specialist provides correct information
- Metrics match their domains
- No confusion or incorrect answers

✅ **Fallback works**

- Sarah handles general questions without transferring
- System is stable and reliable

---

## 🎉 NEXT STEPS AFTER SUCCESS

Once everything is working:

### 1. Monitor Performance (Week 1)

- Check call logs daily
- Track transfer success rate
- Identify any misrouting issues
- Collect user feedback

### 2. Refine (Week 2)

- Adjust keywords based on real conversations
- Improve specialist greetings
- Optimize transfer messages
- Add more trigger phrases

### 3. Scale (Month 1+)

- Add more specialists if needed
- Implement analytics dashboard
- A/B test different approaches
- Train specialists with real data

---

## 📞 NEED HELP?

If you encounter issues during implementation:

1. **Check VAPI Documentation:**

   - https://docs.vapi.ai/squads
   - https://docs.vapi.ai/assistants

2. **Review Call Logs:**

   - VAPI Dashboard → Calls
   - Look for transfer attempts
   - Check function call logs

3. **Contact Me:**
   - Share specific error messages
   - Provide call transcript
   - Describe expected vs actual behavior

---

## 🎯 QUICK REFERENCE

### Specialist Trigger Keywords

**Paula (Performance Leads):**

- immediate leads, buy leads, qualified leads, performance leads, lead delivery, instant leads, ready to close

**Alex (AI Intake):**

- AI intake, automation, 24/7, after hours, chatbot, automated responses, client capture, missing calls

**Peter (PPC):**

- Google Ads, PPC, Facebook ads, Meta ads, paid advertising, online ads, YouTube ads, ad campaigns

**Patricia (Practice Areas):**

- medical malpractice, immigration law, personal injury, family law, practice area, case values, specific cases

### Test Phrases

**For Paula:** "We need immediate qualified leads for our practice"
**For Alex:** "We're missing calls after hours and need automation"
**For Peter:** "We want to run Google Ads for our law firm"
**For Patricia:** "We're a medical malpractice firm looking to grow"
**For No Transfer:** "Tell me about your company"

---

**You're ready to build your Squad! Start with Phase 1, Step 1.1** 🚀

**Questions? Ask before you start each phase!**
