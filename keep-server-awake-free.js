#!/usr/bin/env node
/**
 * FREE Solution: Keep Render Server Awake
 * Runs locally and pings server every 2-3 minutes
 * 
 * Usage:
 *   node keep-server-awake-free.js
 * 
 * Keep this running in a terminal or background process
 */

const https = require('https');

const SERVER_URL = 'https://vapi-caseboost-voice-assistant.onrender.com';
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes (free tier allows this)
const MAX_RETRIES = 3;

let pingCount = 0;
let successCount = 0;
let failCount = 0;

function pingServer() {
  pingCount++;
  const startTime = Date.now();
  
  console.log(`\n[${new Date().toLocaleTimeString()}] Ping #${pingCount}...`);
  
  const req = https.get(`${SERVER_URL}/health`, {
    timeout: 15000 // 15 second timeout
  }, (res) => {
    const responseTime = Date.now() - startTime;
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        successCount++;
        console.log(`✅ Server responded in ${responseTime}ms`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Success rate: ${successCount}/${pingCount} (${Math.round(successCount/pingCount*100)}%)`);
      } else {
        failCount++;
        console.log(`⚠️  Server responded with status ${res.statusCode}`);
      }
    });
  });
  
  req.on('error', (error) => {
    failCount++;
    const responseTime = Date.now() - startTime;
    
    if (error.code === 'ETIMEDOUT') {
      console.log(`⏳ Request timed out after ${responseTime}ms (server may be waking up)`);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(`   Success rate: ${successCount}/${pingCount} (${Math.round(successCount/pingCount*100)}%)`);
  });
  
  req.on('timeout', () => {
    req.destroy();
    failCount++;
    console.log(`⏳ Request timed out (server may be sleeping)`);
  });
}

// Start pinging
console.log('🚀 Starting FREE server keep-alive service...');
console.log(`📍 Server: ${SERVER_URL}`);
console.log(`⏰ Interval: ${PING_INTERVAL / 1000} seconds (${PING_INTERVAL / 60000} minutes)`);
console.log(`💡 Keep this script running to prevent server from sleeping`);
console.log(`\nPress Ctrl+C to stop\n`);

// Initial ping
pingServer();

// Set up interval
const interval = setInterval(() => {
  pingServer();
}, PING_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping keep-alive service...');
  clearInterval(interval);
  console.log(`📊 Final stats:`);
  console.log(`   Total pings: ${pingCount}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Success rate: ${Math.round(successCount/pingCount*100)}%`);
  process.exit(0);
});

// Keep process alive
process.stdin.resume();

