/**
 * GoHighLevel Webhook Handler
 * 
 * Receives GHL form submissions and triggers VAPI outbound calls
 * with ALL form data passed as variables for personalization
 */

const axios = require('axios');
const { mapGHLFormToVAPIVariables, validateVAPIVariables, logVariablesForDebugging } = require('../../scripts/ghl-to-vapi-mapper');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// VAPI Configuration
const SQUAD_ID = 'd84cc64f-e67b-4020-8204-8a1cfdacdf16'; // Case Boost Squad
const PHONE_NUMBER_ID = '21a417c0-ef45-41dc-a5fa-e02207fb9dad'; // Case Boost number

/**
 * Handle GHL form submission webhook
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function handleGHLFormSubmission(req, res) {
  try {
    console.log('📨 Received GHL webhook:', req.body);
    
    const ghlContact = req.body;
    
    // Validate required fields
    if (!ghlContact.phone && !ghlContact.customer?.number) {
      console.error('❌ No phone number in webhook data');
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }
    
    // Map GHL form data to VAPI variables
    const vapiVariables = mapGHLFormToVAPIVariables(ghlContact);
    
    // Validate variables
    const validation = validateVAPIVariables(vapiVariables);
    
    if (!validation.isValid) {
      console.error('❌ Variable validation failed:', validation.errors);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid contact data',
        details: validation.errors
      });
    }
    
    // Log variables for debugging (with sensitive data masked)
    logVariablesForDebugging(vapiVariables);
    
    // Format phone number (ensure E.164 format)
    const phoneNumber = formatPhoneNumber(ghlContact.phone || ghlContact.customer?.number);
    
    if (!phoneNumber) {
      console.error('❌ Invalid phone number format');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format' 
      });
    }
    
    // Prepare VAPI call payload
    const callPayload = {
      squadId: SQUAD_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
        name: vapiVariables.fullName || `${vapiVariables.firstName} ${vapiVariables.lastName}`.trim()
      },
      assistantOverrides: {
        variableValues: vapiVariables
      },
      metadata: {
        ghl_contact_id: ghlContact.id || ghlContact.contactId,
        form_submission_date: new Date().toISOString(),
        source: 'GHL Form Submission'
      }
    };
    
    console.log('📞 Initiating VAPI call with variables...');
    
    // Call VAPI API
    const response = await axios.post(
      `${VAPI_BASE_URL}/call/phone`,
      callPayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ VAPI call initiated:', response.data.id);
    
    // Return success response to GHL
    return res.status(200).json({
      success: true,
      message: 'Call initiated successfully',
      callId: response.data.id,
      variablesPassedCount: Object.keys(vapiVariables).length
    });
    
  } catch (error) {
    console.error('❌ Error handling GHL webhook:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate call',
      details: error.response?.data || error.message
    });
  }
}

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, add it
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If it's a US number (10 digits), add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits and starts with 1, it's already a US number
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // For other formats, add + prefix
  return `+${cleaned}`;
}

/**
 * Health check endpoint
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function healthCheck(req, res) {
  res.status(200).json({
    status: 'healthy',
    service: 'GHL to VAPI Webhook Handler',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  handleGHLFormSubmission,
  healthCheck,
  formatPhoneNumber
};

