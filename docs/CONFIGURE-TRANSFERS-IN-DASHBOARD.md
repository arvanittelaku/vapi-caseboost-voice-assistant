# 🎯 Configure Transfers in VAPI Dashboard - Final Step

**Status:** ✅ All assistants configured with system messages  
**Next:** Configure transfer destinations manually in VAPI Dashboard  
**Time Required:** 10 minutes

---

## 🎉 WHAT'S ALREADY DONE

✅ **All 5 Assistants Created:**
- Sarah (Primary) - ID: `87bbafd3-e24d-4de6-ac76-9ec93d180571`
- Paula (Performance Leads) - ID: `8c09f5c7-c1f8-4015-b632-19b51456b522`
- Alex (AI Intake) - ID: `c27cd255-230c-4a00-bd0d-8fb0dd97976a`
- Peter (PPC) - ID: `11a75fe5-0bbf-4c09-99bc-548830cd6af8`
- Patricia (Practice Areas) - ID: `e3152d1f-4e00-44f3-a5de-5125bbde4cc6`

✅ **All System Messages Configured:**
- Sarah knows when to transfer to specialists
- Each specialist has their expertise and greeting configured
- Voice settings configured (11labs, "sarah" voice)
- Model set to GPT-4o with 0.7 temperature

---

## 🔧 WHAT YOU NEED TO DO NOW

### Option 1: Configure Transfers in VAPI Dashboard (Recommended)

VAPI requires transfer destinations to be configured through their dashboard UI.

#### Step 1: Open Sarah's Configuration

1. Go to: https://dashboard.vapi.ai/assistants
2. Find **Sarah** in the list (ID: 87bbafd3-e24d-4de6-ac76-9ec93d180571)
3. Click on her to open the configuration page

#### Step 2: Look for Transfer/Squad Settings

Look for one of these sections (the exact name may vary):
- "Transfer Destinations"
- "Squad Configuration"
- "Transfer Settings"
- "Assistant Transfers"
- A button/section near the bottom labeled "Transfers" or "Squad"

#### Step 3: Add Each Transfer Destination

For each specialist, add them as a transfer destination:

**Paula - Performance Leads:**
```
Assistant ID: 8c09f5c7-c1f8-4015-b632-19b51456b522
Name: Paula - Performance Leads
Transfer Message: "Let me connect you with Paula, our Performance Lead Delivery specialist who can help you get qualified cases delivered directly to your firm."
```

**Alex - AI Intake:**
```
Assistant ID: c27cd255-230c-4a00-bd0d-8fb0dd97976a
Name: Alex - AI Intake
Transfer Message: "I'll connect you with Alex, our AI Intake specialist who designs systems that capture leads around the clock."
```

**Peter - PPC:**
```
Assistant ID: 11a75fe5-0bbf-4c09-99bc-548830cd6af8
Name: Peter - PPC
Transfer Message: "Let me get Peter on the line - he's our PPC specialist for law firms and can discuss your paid advertising strategy."
```

**Patricia - Practice Areas:**
```
Assistant ID: e3152d1f-4e00-44f3-a5de-5125bbde4cc6
Name: Patricia - Practice Areas
Transfer Message: "I'll connect you with Patricia, our Practice Area consultant who specializes in your field."
```

#### Step 4: Save Configuration

1. Click **"Save"** or **"Update Assistant"** at the bottom
2. Verify all 4 transfer destinations appear in Sarah's configuration

---

### Option 2: If There's No Transfer UI in Dashboard

If you don't see a "Transfer" or "Squad" section in the VAPI dashboard, it might mean:

1. **Your VAPI plan doesn't include Squads** - You may need to upgrade your plan
2. **The feature is named differently** - Look for "Multi-Agent" or similar
3. **It's in a different location** - Check the top-level menu for "Squads"

**In this case:**
- Contact VAPI support and ask how to enable assistant-to-assistant transfers
- Request Squad feature access if needed
- Ask for documentation on setting up transfer destinations

---

## 🧪 TESTING YOUR SQUAD

Once transfers are configured, test them:

### Step 1: Make a Test Call

```bash
npm run test-vapi-call +12132127052
```

### Step 2: Try Each Transfer Trigger

**Test Paula (Performance Leads):**
```
YOU: "Hi Sarah, we need immediate qualified leads for our personal injury practice."

EXPECTED:
- Sarah says she'll connect you with Paula
- Brief pause
- Paula greets you and references what Sarah said
```

**Test Alex (AI Intake):**
```
YOU: "We're missing calls after hours and need some kind of automation."

EXPECTED:
- Sarah transfers to Alex
- Alex greets you and discusses AI intake
```

**Test Peter (PPC):**
```
YOU: "We want to run Google Ads for our law firm."

EXPECTED:
- Sarah transfers to Peter
- Peter discusses PPC advertising
```

**Test Patricia (Practice Areas):**
```
YOU: "We're a medical malpractice firm looking to grow our practice."

EXPECTED:
- Sarah transfers to Patricia
- Patricia discusses medical malpractice growth strategies
```

**Test No Transfer (Fallback):**
```
YOU: "Tell me about your company."

EXPECTED:
- Sarah answers directly without transferring
- Provides general CaseBoost information
```

---

## ✅ SUCCESS CHECKLIST

Your Squad is working correctly when:

- [ ] Sarah detects keywords and announces transfers
- [ ] Each specialist's voice/greeting plays after transfer
- [ ] Specialists reference what Sarah said ("Sarah mentioned...")
- [ ] Context is preserved (specialist knows practice area, etc.)
- [ ] No errors or dropped calls during transfer
- [ ] Sarah handles general questions without transferring

---

## 🐛 TROUBLESHOOTING

### Issue: "I don't see a Transfer/Squad section in Sarah's config"

**Solutions:**
1. Check if your VAPI plan includes multi-agent features
2. Look for a top-level "Squads" menu item (not under Assistants)
3. Contact VAPI support: support@vapi.ai

### Issue: "Transfers are configured but Sarah doesn't use them"

**Solutions:**
1. Check Sarah's system message includes the transfer instructions
2. Make sure you saved the transfer destinations
3. Try more explicit trigger phrases: "We need to buy immediate qualified leads"
4. Check VAPI call logs to see if transfer was attempted

### Issue: "Transfer happens but specialist doesn't speak"

**Solutions:**
1. Verify specialist's Assistant ID is correct
2. Check specialist has a "First Message" configured
3. Ensure specialist's voice settings are configured

### Issue: "Context not preserved after transfer"

**This is expected with VAPI's current architecture:**
- Specialists should reference the transfer in their greeting: "Sarah mentioned..."
- This creates the impression of continuity
- Full context preservation may require additional configuration

---

## 📊 ALTERNATIVE: Squad Configuration File

If VAPI supports creating Squads via API (check their latest docs), you can use this configuration:

```json
{
  "name": "CaseBoost Squad",
  "primaryAssistant": "87bbafd3-e24d-4de6-ac76-9ec93d180571",
  "members": [
    {
      "id": "8c09f5c7-c1f8-4015-b632-19b51456b522",
      "name": "Paula - Performance Leads",
      "role": "specialist"
    },
    {
      "id": "c27cd255-230c-4a00-bd0d-8fb0dd97976a",
      "name": "Alex - AI Intake",
      "role": "specialist"
    },
    {
      "id": "11a75fe5-0bbf-4c09-99bc-548830cd6af8",
      "name": "Peter - PPC",
      "role": "specialist"
    },
    {
      "id": "e3152d1f-4e00-44f3-a5de-5125bbde4cc6",
      "name": "Patricia - Practice Areas",
      "role": "specialist"
    }
  ]
}
```

Save this as `squad-config.json` and ask VAPI support how to import it.

---

## 📞 NEED HELP?

**Contact VAPI Support:**
- Email: support@vapi.ai
- Dashboard: Check for live chat widget
- Documentation: https://docs.vapi.ai/squads

**What to Ask:**
"I have 5 assistants configured and need to set up transfers between them. Where do I configure transfer destinations in the dashboard? My primary assistant ID is 87bbafd3-e24d-4de6-ac76-9ec93d180571."

---

## 🎯 QUICK REFERENCE

### Assistant IDs (Copy-Paste Ready)

```
Sarah:    87bbafd3-e24d-4de6-ac76-9ec93d180571
Paula:    8c09f5c7-c1f8-4015-b632-19b51456b522
Alex:     c27cd255-230c-4a00-bd0d-8fb0dd97976a
Peter:    11a75fe5-0bbf-4c09-99bc-548830cd6af8
Patricia: e3152d1f-4e00-44f3-a5de-5125bbde4cc6
```

### Trigger Keywords

**Paula:** immediate leads, buy leads, qualified leads, performance leads, lead delivery  
**Alex:** AI intake, automation, 24/7, after hours, chatbot, missing calls  
**Peter:** Google Ads, PPC, Facebook ads, paid advertising  
**Patricia:** medical malpractice, immigration law, personal injury, family law, practice area

---

**Ready? Go configure those transfers in the VAPI dashboard!** 🚀

Once done, come back and test with `npm run test-vapi-call +12132127052`

