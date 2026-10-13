const assert = require('assert');
const { db, initDb } = require('../src/database');
const { PayoutWorker } = require('../src/payout');

async function run() {
  console.log('Testing payout worker...');
  initDb();
  await new Promise(r => setTimeout(r, 100)); // wait for tables to be created

  
  // 1. Create a dummy campaign that has target met
  const campaignId = 'payout-test-' + Date.now();
  const now = Math.floor(Date.now()/1000);
  
  await new Promise(r => db.run(`
    INSERT INTO campaigns (id, code, creator_id, title, target_zat, deadline_at, payout_ua, payout_mode, receive_ua, diversifier_index, status, created_at)
    VALUES (?, ?, 'tester', 'Payout Test', 500000000, ?, 'utest1payout', 'auto', 'utest1receive2', 200, 'active', ?)
  `, [campaignId, 'ZDPAYOUT', now + 3600, now], r));

  // 2. Add some confirmed notes that exceed the target
  await new Promise(r => db.run(`
    INSERT INTO received_notes (txid, pool, output_index, value_zat, campaign_id, status, first_seen_at)
    VALUES ('tx1', 'sapling', 0, 600000000, ?, 'confirmed', ?)
  `, [campaignId, now], r));

  // 3. Run payout worker
  await PayoutWorker.runPayouts();

  // 4. Verify campaign status
  const campaign = await new Promise(r => db.get(`SELECT status FROM campaigns WHERE id = ?`, [campaignId], (e, row) => r(row)));
  assert.strictEqual(campaign.status, 'paid_out');
  console.log('✅ Campaign status updated to paid_out');

  // 5. Verify payout record
  const payout = await new Promise(r => db.get(`SELECT * FROM payouts WHERE campaign_id = ?`, [campaignId], (e, row) => r(row)));
  assert.ok(payout);
  assert.strictEqual(payout.status, 'confirmed');
  assert.strictEqual(payout.kind, 'payout');
  assert.strictEqual(payout.gross_zat, 600000000);
  console.log('✅ Payout record created and confirmed');

  // 6. Test Top-up
  console.log('Testing topup for paid_out campaign...');
  await new Promise(r => db.run(`
    INSERT INTO received_notes (txid, pool, output_index, value_zat, campaign_id, status, first_seen_at)
    VALUES ('tx2', 'sapling', 0, 100000000, ?, 'confirmed', ?)
  `, [campaignId, now], r));

  await PayoutWorker.runPayouts();

  const topup = await new Promise(r => db.get(`SELECT * FROM payouts WHERE campaign_id = ? AND kind = 'topup'`, [campaignId], (e, row) => r(row)));
  assert.ok(topup);
  assert.strictEqual(topup.status, 'confirmed');
  assert.strictEqual(topup.gross_zat, 100000000);
  console.log('✅ Topup record created and confirmed');

  console.log('All tests passed!');
  process.exit(0);
}

run().catch(console.error);
