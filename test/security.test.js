const assert = require('assert');

// We simulate sending requests by calling the validation middleware directly,
// but it's easier to just spin up the server or mock req/res.
// Let's create a quick mock for the validation function.
const http = require('http');

async function testSecurity() {
  console.log('Testing security hardening rules...');
  
  const app = require('../src/server');
  const server = app.listen(3001);
  
  const now = Math.floor(Date.now()/1000);
  
  const post = async (body) => {
    const res = await fetch('http://localhost:3001/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    return { status: res.status, body: json };
  };

  // 1. Invalid title (HTML)
  let res = await post({
    title: '<h1>Test</h1>',
    target_zat: 1000,
    deadline_at: now + 3600,
    payout_ua: 'utest1validpayoutaddress1234'
  });
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Invalid title/);
  console.log('✅ HTML in title rejected');

  // 2. Invalid title (too long)
  res = await post({
    title: 'A'.repeat(61),
    target_zat: 1000,
    deadline_at: now + 3600,
    payout_ua: 'utest1validpayoutaddress1234'
  });
  assert.strictEqual(res.status, 400);
  console.log('✅ Too long title rejected');

  // 3. Invalid target_zat
  res = await post({
    title: 'Valid title',
    target_zat: -5,
    deadline_at: now + 3600,
    payout_ua: 'utest1validpayoutaddress1234'
  });
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Invalid target_zat/);
  console.log('✅ Negative target_zat rejected');

  // 4. Invalid deadline
  res = await post({
    title: 'Valid title',
    target_zat: 1000,
    deadline_at: now - 3600, // past
    payout_ua: 'utest1validpayoutaddress1234'
  });
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Invalid deadline_at/);
  console.log('✅ Past deadline rejected');

  // 5. Invalid payout_ua
  res = await post({
    title: 'Valid title',
    target_zat: 1000,
    deadline_at: now + 3600,
    payout_ua: 'your_local_address'
  });
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Invalid payout_ua/);
  console.log('✅ Placeholder payout_ua rejected');

  console.log('All security tests passed!');
  server.close(() => process.exit(0));
}

testSecurity();
