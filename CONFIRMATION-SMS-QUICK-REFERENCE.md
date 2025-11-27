# 📱 Confirmation SMS - Quick Reference

**Complete setup for automated SMS after confirmation calls**

---

## ✅ What You Need to Do

### Step 1: Create 4 GHL Workflows (15 minutes)

Go to GHL → Automation → Workflows and create:

1. **"Confirmation - Appointment Confirmed"**
   - Trigger: Inbound Webhook
   - Action: SMS → "Your appointment with CaseBoost is confirmed..."
   - Copy webhook URL

2. **"Confirmation - Reschedule Request"**
   - Trigger: Inbound Webhook
   - Action: SMS → "Your appointment has been rescheduled..."
   - Copy webhook URL

3. **"Confirmation - Appointment Cancelled"**
   - Trigger: Inbound Webhook
   - Action: SMS → "We understand you can't make your appointment..."
   - Copy webhook URL

4. **"Confirmation - No Answer"**
   - Trigger: Inbound Webhook
   - Action: SMS → "We tried calling about your appointment..."
   - Copy webhook URL

📄 **See full instructions:** `CONFIRMATION-SMS-WORKFLOWS-SETUP.md`

---

### Step 2: Add Webhook URLs to .env

```bash
GHL_WEBHOOK_CONFIRMATION_CONFIRMED=https://services.leadconnectorhq.com/hooks/xxxxx
GHL_WEBHOOK_CONFIRMATION_RESCHEDULED=https://services.leadconnectorhq.com/hooks/xxxxx
GHL_WEBHOOK_CONFIRMATION_CANCELLED=https://services.leadconnectorhq.com/hooks/xxxxx
GHL_WEBHOOK_CONFIRMATION_NO_ANSWER=https://services.leadconnectorhq.com/hooks/xxxxx
```

---

### Step 3: Add Tool to VAPI Confirmation Assistant

In VAPI Dashboard → Your Confirmation Assistant → Tools:

**Add Function Tool:**
```json
{
  "type": "function",
  "function": {
    "name": "report_confirmation_outcome",
    "description": "Report the outcome of the confirmation call",
    "parameters": {
      "type": "object",
      "properties": {
        "outcome": {
          "type": "string",
          "enum": ["confirmed", "rescheduled", "cancelled", "no_answer"]
        },
        "newAppointmentTime": {
          "type": "string",
          "description": "New time if rescheduled"
        }
      },
      "required": ["outcome"]
    }
  },
  "server": {
    "url": "https://your-server.com/webhook/confirmation-outcome"
  }
}
```

📄 **Full config:** `VAPI-CONFIRMATION-TOOL-CONFIG.json`

---

### Step 4: Update Confirmation Assistant Prompt

Add this to your confirmation assistant's system prompt:

```
After each call, you MUST call the report_confirmation_outcome function:

- If customer CONFIRMS: call with outcome="confirmed"
- If customer wants to RESCHEDULE: call with outcome="rescheduled" and newAppointmentTime
- If customer wants to CANCEL: call with outcome="cancelled"
- If you reach VOICEMAIL or NO ANSWER: call with outcome="no_answer"

Examples:
- User: "Yes, I'll be there" → report_confirmation_outcome(outcome="confirmed")
- User: "Can we do 3pm instead?" → report_confirmation_outcome(outcome="rescheduled", newAppointmentTime="Today at 3:00 PM")
- User: "I need to cancel" → report_confirmation_outcome(outcome="cancelled")
- Voicemail reached → report_confirmation_outcome(outcome="no_answer")
```

---

## 🧪 Testing

### Test Locally:

```bash
# Test confirmed scenario
node test-confirmation-sms.js confirmed

# Test rescheduled scenario
node test-confirmation-sms.js rescheduled

# Test cancelled scenario
node test-confirmation-sms.js cancelled

# Test no-answer scenario
node test-confirmation-sms.js no_answer

# Test all scenarios
node test-confirmation-sms.js all
```

**Important:** Set `TEST_CONTACT_ID` in `.env` to a real GHL contact ID before testing!

---

## 📊 How It Works

```
Confirmation Call (VAPI)
    ↓
Customer responds "Yes, I'll be there"
    ↓
Assistant calls: report_confirmation_outcome(outcome="confirmed")
    ↓
Your server receives webhook
    ↓
Server calls GHL workflow webhook
    ↓
GHL sends SMS: "Your appointment is confirmed! ..."
```

---

## 📱 SMS Messages

### ✅ Confirmed
```
Hi John,

Your appointment with CaseBoost is confirmed! 

We're looking forward to speaking with you.

If you need to reschedule, call us at 0203 967 3687.

- CaseBoost Team
```

### 🔄 Rescheduled
```
Hi John,

Perfect! Your appointment has been rescheduled.

📅 New time: Tomorrow at 2:00 PM EST

You'll receive a calendar invite shortly.

See you then!

- CaseBoost Team
```

### ❌ Cancelled
```
Hi John,

We understand you can't make your appointment. No problem!

📅 Book a new time when ready:
Call us: 0203 967 3687

- CaseBoost Team
```

### 📞 No Answer
```
Hi John,

We tried calling about your appointment at Today at 2:00 PM.

Reply YES to confirm or RESCHEDULE to change time.

Or call us: 0203 967 3687

- CaseBoost Team
```

---

## 🔧 Troubleshooting

### SMS not sending?
1. ✅ Check all 4 webhook URLs are in `.env`
2. ✅ Verify workflows are **Published** (not Draft)
3. ✅ Test with `node test-confirmation-sms.js all`
4. ✅ Check GHL SMS permissions enabled
5. ✅ Verify contact has valid phone number

### Wrong SMS sent?
1. ✅ Check assistant is calling correct outcome
2. ✅ Verify webhook URLs are correct
3. ✅ Review server logs for webhook calls

### Variables not replacing?
1. ✅ Use `{{contact.first_name}}` not `{{first_name}}`
2. ✅ For custom values use `{{custom_values.newAppointmentTime}}`
3. ✅ Check spelling in webhook payload

---

## 📄 Documentation Files

- `CONFIRMATION-SMS-WORKFLOWS-SETUP.md` - Full setup guide
- `VAPI-CONFIRMATION-TOOL-CONFIG.json` - VAPI tool configuration
- `test-confirmation-sms.js` - Test script
- `src/webhooks/confirmation-sms-handler.js` - SMS handler code
- `src/webhooks/confirmation-outcome-webhook.js` - Webhook endpoint

---

## ✅ Checklist

- [ ] Created all 4 workflows in GHL
- [ ] Copied webhook URLs to `.env`
- [ ] Added confirmation tool to VAPI assistant
- [ ] Updated assistant system prompt
- [ ] Set `TEST_CONTACT_ID` in `.env`
- [ ] Tested with `node test-confirmation-sms.js all`
- [ ] Received all 4 SMS successfully
- [ ] Verified SMS formatting on mobile
- [ ] Made test confirmation call
- [ ] SMS sent automatically after call

---

**Questions?** Check the full guide: `CONFIRMATION-SMS-WORKFLOWS-SETUP.md`

**Need help?** Review server logs: `docker logs -f vapi-assistant`

