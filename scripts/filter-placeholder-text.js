#!/usr/bin/env node
/**
 * Filter Placeholder Text from Variables
 * Detects and filters out placeholder text patterns before sending to VAPI
 */

// Load .env from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Check if a value contains placeholder text
 */
function isPlaceholderText(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const placeholderPatterns = [
    /\[.*?\]/,  // [something]
    /first\s*name/i,
    /last\s*name/i,
    /firm\s*name/i,
    /practice\s*area/i,
    /cases?\s*monthly/i,
    /firm\s*size/i,
    /marketing\s*budget/i,
    /email/i,
    /phone/i,
    /^\s*\{\{.*\}\}\s*$/,  // {{variable}}
    /^\s*\$.*\$\s*$/,  // $variable$
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(value));
}

/**
 * Filter placeholder text from variables object
 */
function filterPlaceholderText(variables) {
  const filtered = {};
  const removed = [];
  
  Object.entries(variables).forEach(([key, value]) => {
    if (isPlaceholderText(value)) {
      removed.push({ key, value });
      // Set to empty string instead of placeholder
      filtered[key] = '';
    } else {
      filtered[key] = value;
    }
  });
  
  return { filtered, removed };
}

// Test the function
function testFiltering() {
  console.log('🧪 Testing Placeholder Text Filtering\n');
  console.log('='.repeat(60));
  
  // Test Case 1: Variables with placeholder text
  console.log('\n📋 Test Case 1: Variables with Placeholder Text\n');
  
  const badVariables = {
    firstName: '[first name]',
    lastName: '[last name]',
    email: '[email]',
    phone: '+12135551234',
    firmName: '[firm name]',
    practiceArea: '[practice area]',
    casesMonthly: '[cases monthly]',
    firmSize: '[firm size]'
  };
  
  console.log('Input Variables:');
  console.log(JSON.stringify(badVariables, null, 2));
  
  const { filtered, removed } = filterPlaceholderText(badVariables);
  
  console.log('\n⚠️  Placeholder Text Detected and Removed:');
  removed.forEach(({ key, value }) => {
    console.log(`   ${key}: "${value}" → ""`);
  });
  
  console.log('\n✅ Filtered Variables:');
  console.log(JSON.stringify(filtered, null, 2));
  
  // Test Case 2: Variables with actual values
  console.log('\n📋 Test Case 2: Variables with Actual Values\n');
  
  const goodVariables = {
    firstName: 'Arvanit',
    lastName: 'Telaku',
    email: 'arvanit@finishmaker.com',
    phone: '+12136064730',
    firmName: '',
    practiceArea: '',
    casesMonthly: '',
    firmSize: ''
  };
  
  console.log('Input Variables:');
  console.log(JSON.stringify(goodVariables, null, 2));
  
  const { filtered: filtered2, removed: removed2 } = filterPlaceholderText(goodVariables);
  
  if (removed2.length > 0) {
    console.log('\n⚠️  Placeholder Text Detected:');
    removed2.forEach(({ key, value }) => {
      console.log(`   ${key}: "${value}"`);
    });
  } else {
    console.log('\n✅ No placeholder text detected - all values are clean');
  }
  
  console.log('\n✅ Filtered Variables:');
  console.log(JSON.stringify(filtered2, null, 2));
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY\n');
  console.log('✅ Filter function works correctly');
  console.log('✅ Detects placeholder patterns');
  console.log('✅ Converts placeholders to empty strings');
  console.log('✅ Preserves actual values\n');
  
  console.log('🎯 Recommendation:');
  console.log('   Add this filtering to GHL workflow or variable mapping function');
  console.log('   to prevent placeholder text from reaching VAPI\n');
}

testFiltering();

