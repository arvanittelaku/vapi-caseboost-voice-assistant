#!/usr/bin/env node

/**
 * GHL to VAPI Variable Mapper
 * 
 * Maps GoHighLevel contact fields to VAPI assistant variables
 * Based on actual GHL form structure and custom fields
 */

/**
 * Map GHL contact to VAPI variables
 * @param {Object} ghlContact - GHL contact object from webhook
 * @returns {Object} - VAPI variableValues object
 */
function mapGHLFormToVAPIVariables(ghlContact) {
  return {
    // ===== STANDARD CONTACT FIELDS =====
    firstName: ghlContact.firstName || ghlContact.first_name || '',
    lastName: ghlContact.lastName || ghlContact.last_name || '',
    email: ghlContact.email || '',
    phone: ghlContact.phone || '',
    contactSource: ghlContact.contactSource || ghlContact.source || 'Website Contact Form',
    contactType: ghlContact.contactType || 'Lead',
    message: ghlContact.message || '',
    
    // ===== CUSTOM FIELDS (from form screenshots) =====
    firmName: ghlContact.customField?.['Firm Name'] || 
              ghlContact.companyName || 
              '',
    
    practiceArea: ghlContact.customField?.['Practice Area'] || '',
    
    practiceRegion: ghlContact.customField?.['Practice Region'] || '',
    
    casesMonthly: ghlContact.customField?.['Cases Monthly'] || '',
    
    marketingBudget: ghlContact.customField?.['Marketing Budget'] || '',
    
    firmSize: ghlContact.customField?.['Firm Size'] || '',
    
    additionalInfo: ghlContact.customField?.['Additional Information'] || 
                    ghlContact.message || 
                    '',
    
    emailGenerated: ghlContact.customField?.['Email-Generated'] || '',
    
    urgencyLevel: ghlContact.customField?.['Urgency Level'] || '',
    
    // ===== CURRENT MARKETING ACTIVITIES =====
    // Convert array of activities to readable string
    currentMarketing: formatMarketingActivities(
      ghlContact.customField?.['Current Marketing Activities (Check All That Apply)']
    ),
    
    // ===== DERIVED FIELDS =====
    fullName: `${ghlContact.firstName || ghlContact.first_name || ''} ${ghlContact.lastName || ghlContact.last_name || ''}`.trim(),
    
    // Date of birth (if needed)
    dateOfBirth: ghlContact.dateOfBirth || ''
  };
}

/**
 * Format marketing activities array to readable string
 * @param {Array|string} activities - Array of marketing activities or string
 * @returns {string} - Formatted string
 */
function formatMarketingActivities(activities) {
  if (!activities) return 'Not specified';
  
  // If already a string, return as is
  if (typeof activities === 'string') return activities;
  
  // If array, join with commas
  if (Array.isArray(activities) && activities.length > 0) {
    return activities.join(', ');
  }
  
  return 'Not specified';
}

/**
 * Search GHL for contact by email or phone (for post-call updates)
 * @param {Object} ghlClient - GHL client instance
 * @param {string} email - Contact email
 * @param {string} phone - Contact phone
 * @returns {Promise<Object|null>} - GHL contact object or null
 */
async function findGHLContactByEmailOrPhone(ghlClient, email, phone) {
  try {
    console.log('🔍 Searching GHL for contact:', { email, phone });
    
    // Try email first
    if (email) {
      const contacts = await ghlClient.searchContact(email, null);
      if (contacts && contacts.length > 0) {
        console.log('✅ Found contact by email:', contacts[0].id);
        return contacts[0];
      }
    }
    
    // Try phone if email fails
    if (phone) {
      const contacts = await ghlClient.searchContact(null, phone);
      if (contacts && contacts.length > 0) {
        console.log('✅ Found contact by phone:', contacts[0].id);
        return contacts[0];
      }
    }
    
    console.log('⚠️ Contact not found in GHL');
    return null;
  } catch (error) {
    console.error('❌ Error searching GHL contact:', error.message);
    return null;
  }
}

/**
 * Validate VAPI variables before sending
 * @param {Object} variables - VAPI variables object
 * @returns {Object} - Validation result
 */
function validateVAPIVariables(variables) {
  const warnings = [];
  const errors = [];
  
  // Check required fields
  if (!variables.firstName && !variables.lastName) {
    errors.push('Missing firstName and lastName');
  }
  
  if (!variables.email && !variables.phone) {
    errors.push('Missing both email and phone - need at least one contact method');
  }
  
  // Check for empty critical fields
  if (!variables.practiceArea) {
    warnings.push('Missing practice area - personalization will be limited');
  }
  
  if (!variables.firmName) {
    warnings.push('Missing firm name - opening will be less personalized');
  }
  
  // Log validation results
  if (errors.length > 0) {
    console.error('❌ Variable validation errors:', errors);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Variable validation warnings:', warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Log variables for debugging (with sensitive data masked)
 * @param {Object} variables - VAPI variables
 */
function logVariablesForDebugging(variables) {
  const masked = {
    ...variables,
    email: variables.email ? maskEmail(variables.email) : '',
    phone: variables.phone ? maskPhone(variables.phone) : ''
  };
  
  console.log('📋 VAPI Variables (masked):', JSON.stringify(masked, null, 2));
}

/**
 * Mask email for logging
 * @param {string} email - Email address
 * @returns {string} - Masked email
 */
function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Mask phone for logging
 * @param {string} phone - Phone number
 * @returns {string} - Masked phone
 */
function maskPhone(phone) {
  if (!phone) return '';
  return `***${phone.slice(-4)}`;
}

// Export functions
module.exports = {
  mapGHLFormToVAPIVariables,
  formatMarketingActivities,
  findGHLContactByEmailOrPhone,
  validateVAPIVariables,
  logVariablesForDebugging
};

// If run directly (for testing)
if (require.main === module) {
  console.log('🧪 Testing GHL to VAPI Mapper...\n');
  
  // Mock GHL contact data (from screenshots)
  const mockGHLContact = {
    firstName: 'Arvanit',
    lastName: 'Telaku',
    email: 'arvanit@finishmaker.com',
    phone: '+445454649581515',
    contactSource: 'Website Contact Form',
    contactType: 'Lead',
    message: 'Bsbdbsba',
    dateOfBirth: '',
    customField: {
      'Firm Name': 'Telaku Law Firm',
      'Practice Area': 'Personal Injury',
      'Practice Region': 'California',
      'Cases Monthly': '20-30',
      'Marketing Budget': '$5,000-$10,000',
      'Firm Size': '2-5 attorneys',
      'Additional Information': 'Looking to grow our practice',
      'Email-Generated': 'test@example.com',
      'Urgency Level': 'High',
      'Current Marketing Activities (Check All That Apply)': [
        'Google Ads / PPC',
        'SEO / Content Marketing',
        'Networking / Events'
      ]
    }
  };
  
  console.log('Input GHL Contact:');
  console.log(JSON.stringify(mockGHLContact, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');
  
  const vapiVariables = mapGHLFormToVAPIVariables(mockGHLContact);
  
  console.log('Output VAPI Variables:');
  console.log(JSON.stringify(vapiVariables, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');
  
  const validation = validateVAPIVariables(vapiVariables);
  
  console.log('Validation Result:');
  console.log(`✅ Is Valid: ${validation.isValid}`);
  if (validation.errors.length > 0) {
    console.log(`❌ Errors: ${validation.errors.join(', ')}`);
  }
  if (validation.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${validation.warnings.join(', ')}`);
  }
  
  console.log('\n✅ Mapper test complete!');
}

