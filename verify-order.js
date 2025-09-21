#!/usr/bin/env node

// Quick script to verify order ownership
// Usage: node verify-order.js <order_id>

const orderId = process.argv[2];
if (!orderId) {
  console.log('Usage: node verify-order.js <order_id>');
  process.exit(1);
}

// You'll need to add your actual keys here temporarily
const KEY_ID = 'your_live_key_id';
const KEY_SECRET = 'your_live_key_secret';

if (KEY_ID === 'your_live_key_id') {
  console.log('❌ Please edit this script and add your actual Razorpay keys');
  process.exit(1);
}

const https = require('https');
const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');

const options = {
  hostname: 'api.razorpay.com',
  port: 443,
  path: `/v1/orders/${orderId}`,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }
};

console.log(`🔍 Checking order ${orderId} with key ${KEY_ID.substring(0, 12)}...`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Status: ${res.statusCode}`);

    if (res.statusCode === 200) {
      const order = JSON.parse(data);
      console.log('✅ Order found!');
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Amount: ₹${order.amount / 100}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${new Date(order.created_at * 1000).toLocaleString()}`);
    } else if (res.statusCode === 404) {
      console.log('❌ Order not found - might be created with different keys');
    } else {
      console.log('❌ Error response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();