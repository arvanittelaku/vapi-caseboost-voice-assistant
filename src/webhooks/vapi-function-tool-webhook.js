/**
 * VAPI Function Tool Webhook Handler
 * Receives data from VAPI's send_info_case_boost function tool
 * and updates GHL contact with qualification data
 */

const GHLClient = require('../services/ghl-client');
const ghlClient = new GHLClient();

class VAPIFunctionToolWebhook {
  /**
   * Handle incoming webhook from VAPI function tool
   */
  async handleFunctionToolCall(req, res) {
    try {
      console.log('📞 VAPI Function Tool called:', req.body);
      
      const data = req.body;
      
      // Validate required fields
      if (!data.contact_email && !data.contact_phone) {
        console.error('❌ Missing required contact info (email or phone)');
        return res.status(400).json({ 
          success: false, 
          error: 'Missing contact email or phone' 
        });
      }
      
      // Search for contact in GHL by email/phone
      const email = data.contact_email;
      const phone = data.contact_phone;
      
      console.log('🔍 Searching GHL for contact:', { email, phone });
      
      const contacts = await ghlClient.searchContact(email, phone);
      
      if (!contacts || contacts.length === 0) {
        console.error('❌ Contact not found in GHL');
        return res.status(404).json({ 
          success: false, 
          error: 'Contact not found in GHL' 
        });
      }
      
      const contactId = contacts[0].id;
      console.log('✅ Found GHL contact:', contactId);
      
      // Update contact with qualification data
      const updateData = {
        // Verified/updated form fields
        firm_name: data.firm_name || undefined,
        practice_area: data.practice_area || undefined,
        firm_size: data.firm_size || undefined,
        
        // Qualification data (the key part!)
        current_leads_per_month: data.current_leads_per_month || undefined,
        staff_count: data.staff_count || undefined,
        capacity_leads_per_month: data.capacity_leads_per_month || undefined,
        success_definition: data.success_definition || undefined,
        
        // Meeting details
        consultation_scheduled: data.meeting_requested ? 'Yes' : 'No',
        
        // Call outcome
        qualification_status: 'qualified',
        next_action: data.meeting_requested 
          ? `Meeting scheduled for ${data.meeting_date} at ${data.meeting_time}` 
          : 'Follow up to schedule meeting'
      };
      
      console.log('📝 Updating GHL contact with:', updateData);
      await ghlClient.updateContact(contactId, updateData);
      console.log('✅ Contact updated successfully');
      
      // Add qualification note (optional - continue if it fails)
      try {
        const noteBody = this.generateQualificationNote(data);
        await ghlClient.addNote(contactId, { body: noteBody, userId: null });
        console.log('✅ Qualification note added');
      } catch (noteError) {
        console.log('⚠️  Could not add note (continuing anyway):', noteError.message);
      }
      
      // Create calendar appointment if meeting requested
      if (data.meeting_requested && data.meeting_date && data.meeting_time) {
        try {
          console.log('📅 Creating calendar appointment...');
          
          const { startTime, endTime } = ghlClient.parseMeetingDateTime(
            data.meeting_date,
            data.meeting_time,
            data.meeting_timezone || 'America/New_York'
          );
          
          const calendars = await ghlClient.getCalendars();
          const calendarId = process.env.GOHIGHLEVEL_CALENDAR_ID || (calendars[0]?.id);
          
          if (!calendarId) {
            console.error('❌ No calendar found - cannot create appointment');
          } else {
            const appointment = await ghlClient.createCalendarAppointment(contactId, {
              calendarId: calendarId,
              startTime: startTime,
              endTime: endTime,
              title: `CaseBoost Consultation - ${data.firm_name || 'Prospect'}`,
              timezone: data.meeting_timezone || 'America/New_York',
              notes: `Qualification call completed.\n\n` +
                `Success goal: ${data.success_definition || 'Not specified'}\n` +
                `Current leads/month: ${data.current_leads_per_month || 'Not captured'}\n` +
                `Capacity: ${data.capacity_leads_per_month || 'Not captured'}`
            });
            
            console.log('✅ Calendar appointment created:', appointment.id);
          }
        } catch (error) {
          console.error('❌ Error creating calendar appointment:', error.message);
          // Continue even if calendar creation fails
        }
      }
      
      // Create follow-up task (optional - continue if it fails)
      try {
        const taskTitle = '🔥 Follow up with qualified lead';
        const taskBody = `Qualification call completed.\n\n` +
          `Firm: ${data.firm_name || 'Not specified'}\n` +
          `Practice Area: ${data.practice_area || 'Not specified'}\n\n` +
          `Current leads: ${data.current_leads_per_month || 'Not captured'}\n` +
          `Staff count: ${data.staff_count || 'Not captured'}\n` +
          `Capacity: ${data.capacity_leads_per_month || 'Not captured'}\n` +
          `Success goal: ${data.success_definition || 'Not captured'}\n\n` +
          `Meeting requested: ${data.meeting_requested ? 'Yes' : 'No'}\n` +
          (data.meeting_requested ? `Meeting: ${data.meeting_date} at ${data.meeting_time} ${data.meeting_timezone}` : '');
        
        await ghlClient.createTask(contactId, {
          title: taskTitle,
          body: taskBody,
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        });
        
        console.log('✅ Follow-up task created');
      } catch (error) {
        console.log('⚠️  Could not create task (continuing anyway):', error.message);
      }
      
      // Send success response back to VAPI in the correct format
      // VAPI expects this specific structure for function tools
      return res.status(200).json({ 
        results: [
          {
            toolCallId: req.body.toolCallId || 'unknown',
            result: `Contact updated successfully. All ${Object.keys(updateData).length} fields were updated in GoHighLevel. Contact ID: ${contactId}`
          }
        ]
      });
      
    } catch (error) {
      console.error('❌ Error handling function tool call:', error.message);
      // Even on error, return HTTP 200 with error message in result
      return res.status(200).json({ 
        results: [
          {
            toolCallId: req.body.toolCallId || 'unknown',
            result: `Error updating contact: ${error.message}`
          }
        ]
      });
    }
  }
  
  /**
   * Generate qualification note
   */
  generateQualificationNote(data) {
    return `🤖 VAPI QUALIFICATION COMPLETE

📊 QUALIFICATION DATA:
Current Leads: ${data.current_leads_per_month || 'Not captured'}/month
Staff Count: ${data.staff_count || 'Not captured'}
Capacity: ${data.capacity_leads_per_month || 'Not captured'} leads/month
Success Goal: ${data.success_definition || 'Not captured'}

🏢 FIRM INFO:
Firm: ${data.firm_name || 'Not specified'}
Practice Area: ${data.practice_area || 'Not specified'}
Size: ${data.firm_size || 'Not specified'}

📅 MEETING:
Requested: ${data.meeting_requested ? 'Yes' : 'No'}
${data.meeting_requested ? `Date: ${data.meeting_date}` : ''}
${data.meeting_requested ? `Time: ${data.meeting_time} ${data.meeting_timezone}` : ''}

✅ Status: Qualified Lead - Ready for Consultation`;
  }
}

module.exports = new VAPIFunctionToolWebhook();

