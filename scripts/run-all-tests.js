#!/usr/bin/env node
/**
 * Master Test Runner
 * Runs all tests in order and only passes if ALL tests pass
 * 
 * Usage: node scripts/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Test 2.1: GHL API Connection',
    script: 'test-ghl-connection.js',
    required: true
  },
  {
    name: 'Test 2.2: Calendar Availability',
    script: 'test-calendar-availability.js',
    required: true
  },
  {
    name: 'Test 3.2: Calendar Tool (Webhook)',
    script: 'test-calendar-tool.js',
    required: true
  },
  {
    name: 'Test 3.3: Booking Tool (Webhook)',
    script: 'test-booking-tool.js',
    required: true
  },
  {
    name: 'Test 5.1: Workflow Simulation',
    script: 'test-ghl-workflow-simulation.js',
    required: true
  },
  {
    name: 'Test 5.2: Complete Tool Flow',
    script: 'test-complete-tool-flow.js',
    required: true
  },
  {
    name: 'Check VAPI Tools',
    script: 'check-sarah-tools.js',
    required: false // Informational only
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Running: ${test.name}`);
    console.log('='.repeat(80));
    
    // Use relative path from scripts directory to avoid path issues with spaces
    const testPath = test.script;
    // Change to scripts directory and run from there
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${test.name} PASSED\n`);
        resolve(true);
      } else {
        console.log(`\n❌ ${test.name} FAILED (exit code: ${code})\n`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Error running ${test.name}:`, error.message);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PRE-PRODUCTION TEST SUITE');
  console.log('='.repeat(80));
  console.log('\n⚠️  All tests must pass before making real calls!\n');
  
  const results = [];
  
  for (const test of tests) {
    const passed = await runTest(test);
    results.push({ test: test.name, passed, required: test.required });
    
    if (!passed && test.required) {
      console.log('\n' + '='.repeat(80));
      console.log('❌ REQUIRED TEST FAILED - STOPPING TEST SUITE');
      console.log('='.repeat(80));
      console.log(`\nFailed test: ${test.name}`);
      console.log('\nPlease fix the issue and run tests again before making real calls.\n');
      process.exit(1);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const requiredPassed = results.filter(r => r.required && r.passed).length;
  const requiredTotal = results.filter(r => r.required).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nRequired Tests: ${requiredTotal}`);
  console.log(`✅ Required Passed: ${requiredPassed}`);
  
  if (requiredPassed === requiredTotal) {
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL REQUIRED TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\n🎉 Your system is ready for testing!');
    console.log('\nNext steps:');
    console.log('1. Make a test call to your own number');
    console.log('2. Verify all tools work during the call');
    console.log('3. Check GHL calendar for appointments');
    console.log('4. Monitor Render logs during calls');
    console.log('\n⚠️  Only proceed to production calls when test calls work perfectly!\n');
    process.exit(0);
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('❌ SOME REQUIRED TESTS FAILED');
    console.log('='.repeat(80));
    console.log('\nPlease fix the failing tests before proceeding.\n');
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

