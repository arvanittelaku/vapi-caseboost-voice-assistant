const twilio = require('twilio');

class SMSClient {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are required');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Send SMS message
   */
  async sendSMS(to, message, mediaUrl = null) {
    try {
      const messageData = {
        body: message,
        from: this.phoneNumber,
        to: to
      };

      if (mediaUrl) {
        messageData.mediaUrl = [mediaUrl];
      }

      const response = await this.client.messages.create(messageData);
      console.log('✅ SMS sent successfully:', response.sid);
      return response;
    } catch (error) {
      console.error('❌ Error sending SMS:', error.message);
      throw error;
    }
  }

  /**
   * Send booking link SMS
   */
  async sendBookingLink(phoneNumber, contactName, practiceArea = null) {
    try {
      const bookingLink = process.env.BOOKING_LINK_BASE || 'https://calendly.com/caseboost/consultation';
      const message = `Hi ${contactName}! Thanks for speaking with Sarah from CaseBoost. 

I'd love to show you how we can help grow your ${practiceArea ? practiceArea.toLowerCase() : 'legal'} practice. 

Book your free 30-minute consultation here: ${bookingLink}

Best regards,
Sarah
CaseBoost Team
02039673689`;

      return await this.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('❌ Error sending booking link:', error.message);
      throw error;
    }
  }

  /**
   * Send follow-up SMS
   */
  async sendFollowUp(phoneNumber, contactName, followUpType = 'general') {
    try {
      let message = '';
      
      switch (followUpType) {
        case 'qualified':
          message = `Hi ${contactName}! 

Thanks for your interest in CaseBoost. I've prepared a custom proposal showing how we can help grow your practice.

I'll email it to you shortly, and I'll call you tomorrow to discuss.

Best,
Sarah
CaseBoost`;

          break;
        case 'callback':
          message = `Hi ${contactName}!

As promised, I'm following up about CaseBoost's legal client growth solutions.

When would be a good time for a brief call this week?

Sarah
CaseBoost
02039673689`;

          break;
        case 'not_qualified':
          message = `Hi ${contactName}!

Thanks for your time today. I've sent you some information about CaseBoost's legal client growth solutions.

If anything changes and you'd like to explore how we can help grow your practice, please don't hesitate to reach out.

Best regards,
Sarah
CaseBoost`;

          break;
        default:
          message = `Hi ${contactName}!

Thanks for your interest in CaseBoost. I'll send you some information about our legal client growth solutions.

Best regards,
Sarah
CaseBoost`;

      }

      return await this.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('❌ Error sending follow-up SMS:', error.message);
      throw error;
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(phoneNumber, contactName, appointmentTime) {
    try {
      const message = `Hi ${contactName}!

Just a friendly reminder about your CaseBoost consultation tomorrow at ${appointmentTime}.

I'm looking forward to showing you how we can help grow your legal practice!

If you need to reschedule, just reply to this message.

Best,
Sarah
CaseBoost`;

      return await this.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('❌ Error sending appointment reminder:', error.message);
      throw error;
    }
  }

  /**
   * Send case study SMS
   */
  async sendCaseStudy(phoneNumber, contactName, practiceArea) {
    try {
      let caseStudy = '';
      
      switch (practiceArea?.toLowerCase()) {
        case 'medical negligence':
          caseStudy = `Case Study: Medical Negligence Practice

We helped a London medical negligence firm:
• Increase qualified leads by 340%
• Average case value: £250K+
• 150+ cases generated
• ROI: 4.2x

Want to see how we can do the same for you?`;
          break;
        case 'personal injury':
          caseStudy = `Case Study: Personal Injury Practice

We helped a Manchester PI firm:
• Generate 300+ qualified cases
• Average case value: £25K+
• 24/7 AI intake system
• ROI: 3.8x

Ready to see similar results?`;
          break;
        case 'immigration':
          caseStudy = `Case Study: Immigration Practice

We helped an immigration firm:
• 200+ qualified cases
• Average case value: £15K+
• Multi-language support
• ROI: 3.5x

Interested in learning more?`;
          break;
        default:
          caseStudy = `Case Study: Legal Practice Growth

We've helped 500+ law firms:
• £2.5M+ in client revenue
• 95% client retention
• 3.2x average ROAS
• 24/7 AI intake

Want to see how we can help you?`;
      }

      const message = `Hi ${contactName}!

${caseStudy}

Book a free consultation: ${process.env.BOOKING_LINK_BASE}

Sarah
CaseBoost`;

      return await this.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('❌ Error sending case study:', error.message);
      throw error;
    }
  }

  /**
   * Handle incoming SMS
   */
  async handleIncomingSMS(messageData) {
    try {
      const { From, Body, To } = messageData;
      
      // Log incoming message
      console.log(`📱 Incoming SMS from ${From}: ${Body}`);
      
      // Auto-respond to common keywords
      const body = Body.toLowerCase();
      
      if (body.includes('book') || body.includes('consultation')) {
        await this.sendBookingLink(From, 'there');
      } else if (body.includes('info') || body.includes('more')) {
        await this.sendCaseStudy(From, 'there');
      } else if (body.includes('call') || body.includes('speak')) {
        await this.sendSMS(From, `Hi! I'll have Sarah call you back within 30 minutes. 

Best regards,
CaseBoost Team`);
      } else {
        await this.sendSMS(From, `Hi! Thanks for your message. 

For immediate assistance, please call 02039673689 or book a consultation: ${process.env.BOOKING_LINK_BASE}

Best regards,
CaseBoost Team`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error handling incoming SMS:', error.message);
      throw error;
    }
  }

  /**
   * Test SMS functionality
   */
  async testSMS(testNumber) {
    try {
      console.log('🧪 Testing SMS functionality...');
      
      const message = 'Test message from CaseBoost VAPI system. If you receive this, SMS is working correctly!';
      const response = await this.sendSMS(testNumber, message);
      
      console.log('✅ SMS test successful:', response.sid);
      return true;
    } catch (error) {
      console.error('❌ SMS test failed:', error.message);
      return false;
    }
  }
}

module.exports = SMSClient;
