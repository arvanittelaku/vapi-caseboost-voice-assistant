#!/usr/bin/env node

/**
 * Get ngrok URL
 * 
 * Fetches the current ngrok tunnel URL
 */

const http = require('http');

async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          
          if (tunnels.tunnels && tunnels.tunnels.length > 0) {
            const httpsTunnel = tunnels.tunnels.find(t => t.proto === 'https');
            if (httpsTunnel) {
              resolve(httpsTunnel.public_url);
            } else {
              reject(new Error('No HTTPS tunnel found'));
            }
          } else {
            reject(new Error('No tunnels found. Is ngrok running?'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 Fetching ngrok URL...\n');
    
    const ngrokUrl = await getNgrokUrl();
    
    console.log('✅ ngrok is running!');
    console.log('');
    console.log('📡 Your ngrok URL:');
    console.log(`   ${ngrokUrl}`);
    console.log('');
    console.log('🎯 VAPI Webhook URL (use this in VAPI dashboard):');
    console.log(`   ${ngrokUrl}/webhook/vapi`);
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('   1. Copy the webhook URL above');
    console.log('   2. Go to VAPI Dashboard → Your Squad → Settings');
    console.log('   3. Set "Server URL" to the webhook URL');
    console.log('   4. Save and test!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Make sure ngrok is running:');
    console.log('   Run: ngrok http 3000');
    console.log('');
  }
}

if (require.main === module) {
  main();
}

module.exports = { getNgrokUrl };

