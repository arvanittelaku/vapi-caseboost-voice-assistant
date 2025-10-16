const twilio = require('twilio');

class TwilioVoiceService {
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
   * Make an outbound call
   */
  async makeCall(to, message, recordingEnabled = true) {
    try {
      const twiml = this.generateTwiml(message, recordingEnabled);
      
      const call = await this.client.calls.create({
        twiml: twiml,
        to: to,
        from: this.phoneNumber,
        record: recordingEnabled,
        statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });

      console.log('✅ Twilio call initiated:', call.sid);
      return call;
    } catch (error) {
      console.error('❌ Error making Twilio call:', error.message);
      throw error;
    }
  }

  /**
   * Generate TwiML for voice message
   */
  generateTwiml(message, recordingEnabled = true) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Add greeting
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, message);
    
    // Add pause
    twiml.pause({ length: 2 });
    
    // Add instructions
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, 'Please press 1 to speak with our team, or press 2 to leave a message.');
    
    // Gather input
    twiml.gather({
      numDigits: 1,
      timeout: 10,
      action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/gather`
    }).say({
      voice: 'alice',
      language: 'en-GB'
    }, 'Press 1 for immediate assistance, or press 2 to leave a message.');
    
    // Fallback if no input
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, 'Thank you for calling CaseBoost. Please visit our website or call back during business hours.');
    
    twiml.hangup();
    
    return twiml.toString();
  }

  /**
   * Generate TwiML for call transfer
   */
  generateTransferTwiml(phoneNumber) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, 'Please hold while I transfer you to our team.');
    
    twiml.dial({
      callerId: this.phoneNumber,
      record: true
    }, phoneNumber);
    
    return twiml.toString();
  }

  /**
   * Generate TwiML for voicemail
   */
  generateVoicemailTwiml() {
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, 'Please leave your name, phone number, and a brief message about your legal practice needs. We will call you back within 24 hours.');
    
    twiml.record({
      maxLength: 300,
      action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/recording`,
      transcribe: true,
      transcribeCallback: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/transcription`
    });
    
    twiml.say({
      voice: 'alice',
      language: 'en-GB'
    }, 'Thank you for your message. We will call you back soon.');
    
    twiml.hangup();
    
    return twiml.toString();
  }

  /**
   * Handle incoming calls
   */
  async handleIncomingCall(callSid, from, to) {
    try {
      console.log(`📞 Incoming call from ${from} to ${to}`);
      
      const twiml = new twilio.twiml.VoiceResponse();
      
      twiml.say({
        voice: 'alice',
        language: 'en-GB'
      }, 'Thank you for calling CaseBoost, your legal client growth specialists.');
      
      twiml.pause({ length: 1 });
      
      twiml.say({
        voice: 'alice',
        language: 'en-GB'
      }, 'Press 1 to speak with our team, press 2 to leave a message, or press 3 to hear about our services.');
      
      twiml.gather({
        numDigits: 1,
        timeout: 10,
        action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/gather`
      }).say({
        voice: 'alice',
        language: 'en-GB'
      }, 'Press 1 for immediate assistance, press 2 to leave a message, or press 3 for service information.');
      
      // Fallback
      twiml.say({
        voice: 'alice',
        language: 'en-GB'
      }, 'Thank you for calling CaseBoost. Please visit our website at caseboost.co.uk or call back during business hours.');
      
      twiml.hangup();
      
      return twiml.toString();
    } catch (error) {
      console.error('❌ Error handling incoming call:', error.message);
      throw error;
    }
  }

  /**
   * Handle gather input
   */
  async handleGatherInput(digits, callSid) {
    try {
      const twiml = new twilio.twiml.VoiceResponse();
      
      switch (digits) {
        case '1':
          // Transfer to team
          twiml.say({
            voice: 'alice',
            language: 'en-GB'
          }, 'Please hold while I connect you to our team.');
          
          // In production, this would dial the actual team number
          twiml.say({
            voice: 'alice',
            language: 'en-GB'
          }, 'Our team is currently busy. Please leave a message and we will call you back within 30 minutes.');
          
          twiml.record({
            maxLength: 300,
            action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/recording`
          });
          break;
          
        case '2':
          // Voicemail
          twiml.say({
            voice: 'alice',
            language: 'en-GB'
          }, 'Please leave your name, phone number, and a brief message about your legal practice needs.');
          
          twiml.record({
            maxLength: 300,
            action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/recording`,
            transcribe: true
          });
          break;
          
        case '3':
          // Service information
          twiml.say({
            voice: 'alice',
            language: 'en-GB'
          }, 'CaseBoost specializes in helping law firms grow their practice through AI-powered marketing systems. We offer performance-based pricing, meaning you only pay for results. Our services include AI sales and intake agents, PPC advertising, SEO optimization, and custom growth engines. For more information, visit caseboost.co.uk or press 1 to speak with our team.');
          
          twiml.pause({ length: 2 });
          
          twiml.say({
            voice: 'alice',
            language: 'en-GB'
          }, 'Press 1 to speak with our team, or press 2 to leave a message.');
          
          twiml.gather({
            numDigits: 1,
            timeout: 10,
            action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/gather`
          });
          break;
          
        default:
          twiml.say({
            voice: 'alice',
            language: 'en-GB'
          }, 'I did not understand your selection. Please press 1 to speak with our team, or press 2 to leave a message.');
          
          twiml.gather({
            numDigits: 1,
            timeout: 10,
            action: `${process.env.WEBHOOK_BASE_URL}/webhook/twilio/gather`
          });
      }
      
      return twiml.toString();
    } catch (error) {
      console.error('❌ Error handling gather input:', error.message);
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCall(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return call;
    } catch (error) {
      console.error('❌ Error getting call details:', error.message);
      throw error;
    }
  }

  /**
   * Get call recordings
   */
  async getCallRecordings(callSid) {
    try {
      const recordings = await this.client.recordings.list({
        callSid: callSid
      });
      return recordings;
    } catch (error) {
      console.error('❌ Error getting call recordings:', error.message);
      throw error;
    }
  }

  /**
   * Test Twilio voice functionality
   */
  async testVoice(testNumber) {
    try {
      console.log('🧪 Testing Twilio voice functionality...');
      
      const message = 'This is a test call from CaseBoost VAPI system. If you can hear this message, voice functionality is working correctly.';
      const call = await this.makeCall(testNumber, message);
      
      console.log('✅ Voice test successful:', call.sid);
      return true;
    } catch (error) {
      console.error('❌ Voice test failed:', error.message);
      return false;
    }
  }
}

module.exports = TwilioVoiceService;
