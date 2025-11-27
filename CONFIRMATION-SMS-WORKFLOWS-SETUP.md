# 📱 Appointment Confirmation SMS Workflows - Setup Guide

**Complete guide for setting up automated SMS notifications after confirmation calls**

---

## 🎯 Overview

After the confirmation call (made 1 hour before appointment), the system will automatically send SMS based on the customer's response:

1. ✅ **Confirmed** → Confirmation SMS
2. 🔄 **Rescheduled** → Reschedule SMS with new time
3. ❌ **Cancelled** → Cancellation SMS with rebooking info
4. 📞 **No Answer** → Follow-up SMS asking for confirmation

---

## 📋 Required GHL Workflows (4 Total)

### Workflow 1: ✅ Appointment Confirmed SMS

**Name:** `Confirmation - Appointment Confirmed`

**Trigger:**
- **Type:** Inbound Webhook
- **Webhook URL:** Copy the generated URL (you'll use this in your code)

**Actions:**

1. **SMS Action**
   - **To:** `{{contact.phone}}`
   - **Message:**
     ```
     Hi {{contact.first_name}},

     Your appointment with CaseBoost is confirmed! 

     We're looking forward to speaking with you.

     If you need to reschedule, call us at 0203 967 3687.

     - CaseBoost Team
     ```

**Enrollment Settings:**
- ✅ Allow contact to enroll multiple times

---

### Workflow 2: 🔄 Appointment Rescheduled SMS

**Name:** `Confirmation - Reschedule Request`

**Trigger:**
- **Type:** Inbound Webhook
- **Webhook URL:** Copy the generated URL (you'll use this in your code)

**Actions:**

1. **SMS Action**
   - **To:** `{{contact.phone}}`
   - **Message:**
     ```
     Hi {{contact.first_name}},

     Perfect! Your appointment has been rescheduled.

     📅 New time: {{custom_values.newAppointmentTime}}

     You'll receive a calendar invite shortly.

     See you then!

     - CaseBoost Team
     ```

**Enrollment Settings:**
- ✅ Allow contact to enroll multiple times

---

### Workflow 3: ❌ Appointment Cancelled SMS

**Name:** `Confirmation - Appointment Cancelled`

**Trigger:**
- **Type:** Inbound Webhook
- **Webhook URL:** Copy the generated URL (you'll use this in your code)

**Actions:**

1. **SMS Action**
   - **To:** `{{contact.phone}}`
   - **Message:**
     ```
     Hi {{contact.first_name}},

     We understand you can't make your appointment. No problem!

     📅 Book a new time when ready:
     Call us: 0203 967 3687

     - CaseBoost Team
     ```

**Enrollment Settings:**
- ✅ Allow contact to enroll multiple times

---

### Workflow 4: 📞 No Answer SMS

**Name:** `Confirmation - No Answer`

**Trigger:**
- **Type:** Inbound Webhook
- **Webhook URL:** Copy the generated URL (you'll use this in your code)

**Actions:**

1. **SMS Action**
   - **To:** `{{contact.phone}}`
   - **Message:**
     ```
     Hi {{contact.first_name}},

     We tried calling about your appointment at {{custom_values.appointmentTime}}.

     Reply YES to confirm or RESCHEDULE to change time.

     Or call us: 0203 967 3687

     - CaseBoost Team
     ```

2. **Wait for Inbound Message** (Optional)
   - Listen for replies: "YES", "CONFIRM", "RESCHEDULE", "CANCEL"
   - Add conditional actions based on response

**Enrollment Settings:**
- ✅ Allow contact to enroll multiple times

---

## 🔧 Step-by-Step Setup in GHL

### Step 1: Create Workflow #1 - Confirmed

1. Go to **Automation** → **Workflows**
2. Click **Create Workflow**
3. Name: `Confirmation - Appointment Confirmed`
4. **Trigger:** Select **Inbound Webhook**
5. Copy the webhook URL (looks like: `https://services.leadconnectorhq.com/hooks/...`)
6. Click **+ Add Action** → **SMS**
7. Configure SMS:
   - **To:** `{{contact.phone}}`
   - **Message:** (paste the confirmed message above)
8. **Save** → **Publish**
9. ✅ **IMPORTANT:** Save the webhook URL to your `.env` file:
   ```
   GHL_WEBHOOK_CONFIRMATION_CONFIRMED=https://services.leadconnectorhq.com/hooks/xxxxx
   ```

### Step 2: Create Workflow #2 - Rescheduled

1. Click **Create Workflow**
2. Name: `Confirmation - Reschedule Request`
3. **Trigger:** Select **Inbound Webhook**
4. Copy the webhook URL
5. Add **SMS Action** with reschedule message
6. **Save** → **Publish**
7. Save webhook URL:
   ```
   GHL_WEBHOOK_CONFIRMATION_RESCHEDULED=https://services.leadconnectorhq.com/hooks/xxxxx
   ```

### Step 3: Create Workflow #3 - Cancelled

1. Click **Create Workflow**
2. Name: `Confirmation - Appointment Cancelled`
3. **Trigger:** Select **Inbound Webhook**
4. Copy the webhook URL
5. Add **SMS Action** with cancellation message
6. **Save** → **Publish**
7. Save webhook URL:
   ```
   GHL_WEBHOOK_CONFIRMATION_CANCELLED=https://services.leadconnectorhq.com/hooks/xxxxx
   ```

### Step 4: Create Workflow #4 - No Answer

1. Click **Create Workflow**
2. Name: `Confirmation - No Answer`
3. **Trigger:** Select **Inbound Webhook**
4. Copy the webhook URL
5. Add **SMS Action** with no-answer message
6. **Save** → **Publish**
7. Save webhook URL:
   ```
   GHL_WEBHOOK_CONFIRMATION_NO_ANSWER=https://services.leadconnectorhq.com/hooks/xxxxx
   ```

---

## 📝 Update Your .env File

Add these 4 webhook URLs to your `.env`:

```bash
# Confirmation SMS Workflow Webhooks
GHL_WEBHOOK_CONFIRMATION_CONFIRMED=https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_1
GHL_WEBHOOK_CONFIRMATION_RESCHEDULED=https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_2
GHL_WEBHOOK_CONFIRMATION_CANCELLED=https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_3
GHL_WEBHOOK_CONFIRMATION_NO_ANSWER=https://services.leadconnectorhq.com/hooks/YOUR_WEBHOOK_4

# Company Phone (for SMS messages)
COMPANY_PHONE=0203 967 3687
```

---

## 💻 Code Implementation

Now I'll create the webhook handler that calls these GHL workflows from your VAPI confirmation assistant.

### How It Works:

1. **VAPI confirmation assistant** calls your server endpoint based on customer's response
2. **Your server** determines which SMS to send
3. **Server calls GHL webhook** with contact data
4. **GHL sends SMS** automatically

---

## 🧪 Testing Each Workflow

### Test 1: Confirmed

```bash
curl -X POST "YOUR_GHL_WEBHOOK_CONFIRMED_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "YOUR_TEST_CONTACT_ID",
    "firstName": "John"
  }'
```

**Expected:** John receives confirmation SMS

---

### Test 2: Rescheduled

```bash
curl -X POST "YOUR_GHL_WEBHOOK_RESCHEDULED_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "YOUR_TEST_CONTACT_ID",
    "firstName": "John",
    "custom_values": {
      "newAppointmentTime": "Tomorrow at 2:00 PM EST"
    }
  }'
```

**Expected:** John receives reschedule SMS with new time

---

### Test 3: Cancelled

```bash
curl -X POST "YOUR_GHL_WEBHOOK_CANCELLED_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "YOUR_TEST_CONTACT_ID",
    "firstName": "John"
  }'
```

**Expected:** John receives cancellation SMS

---

### Test 4: No Answer

```bash
curl -X POST "YOUR_GHL_WEBHOOK_NO_ANSWER_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "YOUR_TEST_CONTACT_ID",
    "firstName": "John",
    "custom_values": {
      "appointmentTime": "Today at 2:00 PM"
    }
  }'
```

**Expected:** John receives no-answer follow-up SMS

---

## 📊 Workflow Data Flow

```
Confirmation Call Ends (VAPI)
    ↓
Customer Response Detected
    ↓
    ├─ "Yes, confirmed" → Call GHL Webhook #1 → ✅ Confirmation SMS
    │
    ├─ "Need to reschedule" → Call GHL Webhook #2 → 🔄 Reschedule SMS
    │
    ├─ "Need to cancel" → Call GHL Webhook #3 → ❌ Cancellation SMS
    │
    └─ No Answer / Voicemail → Call GHL Webhook #4 → 📞 No Answer SMS
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 4 workflows created in GHL
- [ ] All 4 webhook URLs copied to `.env`
- [ ] SMS messages use correct company name (CaseBoost)
- [ ] Phone number correct: 0203 967 3687
- [ ] Custom values work: `{{custom_values.newAppointmentTime}}`
- [ ] Test each workflow with curl commands
- [ ] Received SMS for each scenario
- [ ] SMS formatting looks good on mobile
- [ ] Contact fields populated correctly

---

## 🎯 Next Steps

1. ✅ Create all 4 workflows in GHL (copy webhook URLs)
2. ✅ Add webhook URLs to `.env`
3. ✅ I'll create the server-side code to call these webhooks
4. ✅ Update confirmation assistant to detect responses
5. ✅ Test with real confirmation call

---

## 📞 SMS Message Variables Reference

### Available in ALL workflows:
- `{{contact.first_name}}` - Customer's first name
- `{{contact.last_name}}` - Customer's last name
- `{{contact.phone}}` - Customer's phone number
- `{{contact.email}}` - Customer's email

### Custom values you can pass:
- `{{custom_values.appointmentTime}}` - Original appointment time
- `{{custom_values.newAppointmentTime}}` - New rescheduled time
- `{{custom_values.appointmentDate}}` - Appointment date
- `{{custom_values.reason}}` - Cancellation/reschedule reason

---

## 🔍 Troubleshooting

### SMS not sending:
1. Check GHL SMS permissions enabled
2. Verify contact has valid phone number
3. Check workflow is Published (not Draft)
4. Verify webhook URL is correct

### Wrong message sent:
1. Check which webhook URL you're calling
2. Verify logic in confirmation detection
3. Review server logs for webhook calls

### Variables not replacing:
1. Ensure you're passing data in webhook body
2. Check spelling of custom_values keys
3. Use `{{contact.field}}` not `{{field}}`

---

**Ready to implement the server-side code?** Let me know when you've created these 4 workflows and I'll build the webhook integration! 🚀

