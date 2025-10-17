const axios = require('axios');
const config = require('../config/assistant-config');
const { v4: uuidv4 } = require('uuid');

class VAPIClient {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.baseURL = 'https://api.vapi.ai';
    this.assistantId = process.env.VAPI_ASSISTANT_ID;
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new assistant with CaseBoost configuration
   */
  async createAssistant() {
    try {
      const assistantData = {
        name: config.name,
        model: config.vapi.model,
        voice: config.vapi.voice,
        transcriber: config.vapi.transcriber,
        tools: config.tools,
        knowledgeBase: config.knowledgeBase,
        ...config.vapi.advanced
      };

      const response = await this.client.post('/assistant', assistantData);
      console.log('✅ Assistant created successfully:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating assistant:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update an existing assistant
   */
  async updateAssistant(assistantId) {
    try {
      const assistantData = {
        name: config.name,
        model: config.vapi.model,
        voice: config.vapi.voice,
        transcriber: config.vapi.transcriber,
        endCallMessage: config.vapi.endCallMessage,
        firstMessage: "Hi! This is Sarah from CaseBoost calling about growing your legal practice. Is now a good time to chat for a few minutes?"
      };

      const response = await this.client.patch(`/assistant/${assistantId}`, assistantData);
      console.log('✅ Assistant updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating assistant:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get assistant details
   */
  async getAssistant(assistantId) {
    try {
      const response = await this.client.get(`/assistant/${assistantId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting assistant:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all assistants
   */
  async listAssistants() {
    try {
      const response = await this.client.get('/assistant');
      return response.data;
    } catch (error) {
      console.error('❌ Error listing assistants:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a phone number
   */
  async createPhoneNumber() {
    try {
      const phoneData = {
        number: process.env.COMPANY_PHONE || '+442039673689',
        provider: 'twilio',
        assistantId: this.assistantId
      };

      const response = await this.client.post('/phone-number', phoneData);
      console.log('✅ Phone number created successfully:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating phone number:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Make a call
   */
  async makeCall(phoneNumber, contactData = {}) {
    try {
      const callData = {
        phoneNumberId: this.phoneNumberId,
        customer: {
          number: phoneNumber
        },
        assistantId: this.assistantId,
        metadata: {
          lead_source: 'website',
          practice_area: contactData.practice_area || 'unknown',
          first_name: contactData.firstName || 'Test',
          last_name: contactData.lastName || 'User',
          email: contactData.email || 'test@example.com',
          firm_name: contactData.firmName || 'Test Law Firm'
        }
      };

      const response = await this.client.post('/call', callData);
      console.log('✅ Call initiated successfully:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error making call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCall(callId) {
    try {
      const response = await this.client.get(`/call/${callId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * End a call
   */
  async endCall(callId) {
    try {
      const response = await this.client.post(`/call/${callId}/end`);
      console.log('✅ Call ended successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error ending call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload knowledge base file
   */
  async uploadKnowledgeBaseFile(filePath, fileName) {
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('name', fileName);

      const response = await this.client.post('/knowledge-base', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('✅ Knowledge base file uploaded:', fileName);
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading knowledge base file:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test assistant configuration
   */
  async testConfiguration() {
    try {
      console.log('🧪 Testing VAPI configuration...');
      
      // Test API connection
      const assistants = await this.listAssistants();
      console.log('✅ API connection successful');
      
      // Test assistant access
      if (this.assistantId) {
        const assistant = await this.getAssistant(this.assistantId);
        console.log('✅ Assistant access successful:', assistant.name);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Configuration test failed:', error.message);
      return false;
    }
  }
}

module.exports = VAPIClient;
