import assert from 'node:assert/strict';
import { before, after, test, mock } from 'node:test';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';

let db,
  cases,
  runner,
  delivery,
  context,
  native,
  checkout,
  customer,
  shipping,
  policy,
  product;
let decisions = [];
const originalFetch = globalThis.fetch;
before(async () => {
  assert.match(
    process.env.DB_NAME || '',
    /_qa$/,
    'Run against a disposable database ending in _qa.'
  );
  process.env.ALLOW_CONFIG_MUTATIONS = 'true';
  process.env.SUPPORT_MODEL = 'test-simulation';
  ({ pool: db } = await import(
    '../extensions/ordex/dist/services/support/db.js'
  ));
  cases = await import('../extensions/ordex/dist/services/support/cases.js');
  runner = await import('../extensions/ordex/dist/services/support/agent.js');
  delivery = await import(
    '../extensions/ordex/dist/services/support/delivery.js'
  );
  context = await import(
    '../extensions/ordex/dist/services/support/deliveryContext.js'
  );
  native = await import('@evershop/evershop/oms/services');
  checkout = await import('@evershop/evershop/checkout/services');
  const { ensureRoutesLoaded } = await import(
    '../packages/evershop/dist/bin/lib/ensureRoutesLoaded.js'
  );
  ensureRoutesLoaded();
  const { getCoreModules } = await import(
    '../packages/evershop/dist/bin/lib/loadModules.js'
  );
  const { loadBootstrapScript } = await import(
    '../packages/evershop/dist/bin/lib/bootstrap/bootstrap.js'
  );
  for (const m of [
    ...getCoreModules(),
    { path: process.cwd() + '/extensions/ordex/dist' }
  ])
    await loadBootstrapScript(m, {
      command: 'seed',
      env: 'test',
      process: 'main'
    });
  const { limits } = await import(
    '../extensions/ordex/dist/services/support/model.js'
  );
  limits.minute = 1000;
  limits.daily = 10000;
  limits.inputTokensMinute = 10000000;
  customer = (
    await db.query("SELECT * FROM customer WHERE email='maya@ordex.example'")
  ).rows[0];
  shipping = (
    await db.query(
      "SELECT uuid FROM core_shipping_method WHERE name='Standard delivery'"
    )
  ).rows[0];
  product = (
    await db.query(
      'SELECT p.* FROM product p JOIN product_inventory i ON i.product_inventory_product_id=p.product_id WHERE p.status=true AND p.price BETWEEN 400 AND 700 AND i.qty>10 ORDER BY p.price LIMIT 1'
    )
  ).rows[0];
  policy = (await import('../extensions/ordex/dist/services/support/db.js'))
    .policy;
  const p = await policy();
  await cases.adminCommand('QA seller', {
    command: 'policy',
    version: p.policy_id,
    settings: { ...p.settings, autoRefund: true, autoRefundMinor: 100000 }
  });
  mock.method(globalThis, 'fetch', async (url, init) => {
    if (!String(url).includes('generativelanguage.googleapis.com'))
      return originalFetch(url, init);
    assert.ok(
      decisions.length,
      'Model calls must have explicit test decisions'
    );
    const result = decisions.shift();
    return Response.json({
      steps: [
        {
          type: 'model_output',
          content: [{ type: 'text', text: JSON.stringify(result) }]
        }
      ],
      usage: { total_input_tokens: 20, total_output_tokens: 10 }
    });
  });
});
after(async () => {
  mock.restoreAll();
  await db?.end();
});
async function order(qty = 1, oldCart = false) {
  const cart = await checkout.createNewCart(randomUUID(), customer);
  await cart.addItem(product.product_id, qty, {});
  await checkout.saveCart(cart);
  if (oldCart)
    await db.query(
      "UPDATE cart SET created_at=now()-interval '30 days' WHERE uuid=$1",
      [cart.getData('uuid')]
    );
  const address = {
    given_name: 'Maya',
    family_name: 'Shah',
    address_line_1: '24 Sample Lane',
    locality: 'Bengaluru',
    administrative_area: 'IN-KA',
    country: 'IN',
    postal_code: '560001',
    telephone: '+919000000000'
  };
  return checkout.checkout(cart.getData('uuid'), {
    shippingAddress: address,
    billingAddress: address,
    paymentMethod: 'demo',
    shippingMethod: shipping.uuid,
    shippingProvider: 'core'
  });
}
async function stock() {
  return Number(
    (
      await db.query(
        'SELECT qty FROM product_inventory WHERE product_inventory_product_id=$1',
        [product.product_id]
      )
    ).rows[0].qty
  );
}
async function propose(o) {
  const { caseId } = await cases.customerCommand(customer.customer_id, {
    command: 'open',
    orderId: o.uuid
  });
  decisions.push({
    kind: 'cancel',
    items: [],
    reason: '',
    sources: [],
    quotes: []
  });
  await cases.customerCommand(customer.customer_id, {
    command: 'message',
    caseId,
    body: 'Cancel my entire order, please.',
    clientKey: randomUUID()
  });
  await runner.tick({ caseId });
  const d = await cases.detail(caseId, customer.customer_id);
  const a = d.actions.find((a) => a.kind === 'cancel');
  assert.ok(a);
  return { caseId, a };
}
async function confirm(c) {
  await cases.customerCommand(customer.customer_id, {
    command: 'confirm',
    caseId: c.caseId,
    actionId: c.a.action_id,
    hash: c.a.payload_hash
  });
  await runner.tick({ caseId: c.caseId });
}

test('old carts create orders dated at checkout', async () => {
  const start = Date.now();
  const o = await order(1, true);
  assert.ok(new Date(o.created_at).getTime() >= start - 1000);
  await native.cancelOrder(o.uuid, 'QA cleanup');
});
test('sequential and concurrent cancellation restores stock and reverses payment exactly once', async () => {
  const before = await stock();
  const o = await order();
  assert.equal(await stock(), before - 1);
  await Promise.all([
    native.cancelOrder(o.uuid, 'QA cancel'),
    native.cancelOrder(o.uuid, 'QA replay')
  ]);
  await native.cancelOrder(o.uuid, 'QA repeat');
  assert.equal(await stock(), before);
  const payments = (
    await db.query(
      "SELECT * FROM demo_payment WHERE order_id=$1 AND kind='refund'",
      [o.order_id]
    )
  ).rows;
  assert.equal(payments.length, 1);
  assert.equal(
    Number(payments[0].amount_minor),
    Math.round(Number(o.grand_total) * 100)
  );
  const current = (
    await db.query('SELECT * FROM "order" WHERE order_id=$1', [o.order_id])
  ).rows[0];
  assert.equal(current.status, 'canceled');
  assert.equal(current.payment_status, 'demo_refunded');
  assert.equal(current.shipment_status, 'canceled');
  const item = (
    await db.query('SELECT * FROM order_item WHERE order_item_order_id=$1', [
      o.order_id
    ])
  ).rows[0];
  await assert.rejects(() =>
    native.createShipment(o.uuid, {
      carrier: 'demo',
      items: [{ order_item_id: item.order_item_id, qty: 1 }]
    })
  );
});

test('legacy cancellation reconciliation refunds the balance without another restock', async () => {
  const o = await order();
  await db.query(
    'UPDATE product_inventory SET qty=qty+1 WHERE product_inventory_product_id=$1',
    [product.product_id]
  );
  await db.query(
    "UPDATE \"order\" SET status='canceled',shipment_status='canceled',payment_status='canceled' WHERE order_id=$1",
    [o.order_id]
  );
  const before = await stock();
  await native.cancelOrder(o.uuid, 'Reconcile legacy cancellation');
  await native.cancelOrder(o.uuid, 'Repeat repair');
  assert.equal(await stock(), before);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM demo_payment WHERE order_id=$1 AND kind='refund'",
        [o.order_id]
      )
    ).rows[0].n,
    1
  );
});

test('agent cancellation requires exact consent and resolves with a verified receipt', async () => {
  const o = await order();
  const c = await propose(o);
  assert.equal(
    (
      await db.query('SELECT status FROM "order" WHERE order_id=$1', [
        o.order_id
      ])
    ).rows[0].status,
    'processing'
  );
  await assert.rejects(() =>
    cases.customerCommand(customer.customer_id, {
      command: 'confirm',
      caseId: c.caseId,
      actionId: c.a.action_id,
      hash: 'wrong'
    })
  );
  await confirm(c);
  await runner.tick({ caseId: c.caseId });
  const d = await cases.detail(c.caseId, customer.customer_id);
  assert.equal(d.case.status, 'RESOLVED');
  assert.ok(d.messages.some((m) => m.metadata?.receipt?.canceled));
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM demo_payment WHERE order_id=$1 AND kind='refund'",
        [o.order_id]
      )
    ).rows[0].n,
    1
  );
});
test('above-cap cancellation waits for exact seller approval, then resumes', async () => {
  const o = await order(3),
    c = await propose(o);
  await confirm(c);
  let d = await cases.detail(c.caseId);
  const a = d.actions.find((a) => a.kind === 'cancel');
  assert.equal(a.state, 'awaiting_approval');
  assert.notEqual(
    (
      await db.query('SELECT status FROM "order" WHERE order_id=$1', [
        o.order_id
      ])
    ).rows[0].status,
    'canceled'
  );
  const customerView = await cases.detail(c.caseId, customer.customer_id);
  assert.equal(customerView.brief, undefined);
  assert.ok(
    !JSON.stringify(customerView).includes('payload_hash":"' + a.payload_hash)
  );
  assert.match(d.brief.decision, /Approve or decline cancel/);
  await cases.adminCommand('QA seller', {
    command: 'approve',
    caseId: c.caseId,
    actionId: a.action_id,
    hash: a.payload_hash
  });
  await runner.tick({ caseId: c.caseId });
  d = await cases.detail(c.caseId);
  assert.equal(d.case.status, 'RESOLVED');
});
test('a shipment created after consent blocks cancellation without moving stock or money', async () => {
  const o = await order(),
    c = await propose(o);
  const item = (
    await db.query('SELECT * FROM order_item WHERE order_item_order_id=$1', [
      o.order_id
    ])
  ).rows[0];
  await native.createShipment(o.uuid, {
    carrier: 'demo',
    items: [{ order_item_id: item.order_item_id, qty: 1 }]
  });
  const before = await stock();
  await confirm(c);
  assert.equal(await stock(), before);
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM demo_payment WHERE order_id=$1 AND kind='refund'",
        [o.order_id]
      )
    ).rows[0].n,
    0
  );
});
async function event(o, kind, note, id = randomUUID(), at = new Date()) {
  return delivery.deliveryCommand('QA seller', {
    command: 'event',
    orderId: o.uuid,
    eventId: id,
    kind,
    note,
    occurredAt: at.toISOString()
  });
}
async function watch(o) {
  return delivery.deliveryCommand('QA seller', {
    command: 'watch',
    orderId: o.uuid,
    dispatchDueAt: new Date(Date.now() - 3600000).toISOString(),
    expectedAt: new Date(Date.now() + 86400000).toISOString()
  });
}
async function tick(o) {
  await db.query(
    'UPDATE support_delivery_watch SET next_check_at=now() WHERE order_id=$1',
    [o.order_id]
  );
  await delivery.tickDelivery(o.order_id);
}
test('delivery risk investigates, deduplicates, resumes an overdue follow-up and resolves', async () => {
  const o = await order();
  await watch(o);
  decisions.push({ decision: 'monitor' });
  await tick(o);
  let w = (
    await db.query('SELECT * FROM support_delivery_watch WHERE order_id=$1', [
      o.order_id
    ])
  ).rows[0];
  assert.equal(w.phase, 'monitoring');
  assert.ok(w.follow_up_at);
  const count = () =>
    db.query(
      'SELECT count(*)::int AS n FROM support_message WHERE case_id=$1',
      [w.case_id]
    );
  const n = (await count()).rows[0].n;
  await tick(o);
  assert.equal((await count()).rows[0].n, n);
  const promised = w.follow_up_at;
  await db.query(
    "UPDATE support_delivery_watch SET evidence_hash='old-fingerprint' WHERE order_id=$1",
    [o.order_id]
  );
  decisions.push({ decision: 'monitor' });
  await tick(o);
  assert.equal(
    (await count()).rows[0].n,
    n,
    'A changed fingerprint must not repeat the same incident notification'
  );
  assert.equal(
    +new Date(
      (
        await db.query(
          'SELECT follow_up_at FROM support_delivery_watch WHERE order_id=$1',
          [o.order_id]
        )
      ).rows[0].follow_up_at
    ),
    +new Date(promised),
    'A replay must not postpone the promised follow-up'
  );

  await db.query(
    "UPDATE support_delivery_watch SET follow_up_at=now()-interval '1 minute',lease_id=gen_random_uuid(),lease_until=now()-interval '1 minute' WHERE order_id=$1",
    [o.order_id]
  );
  await tick(o);
  w = (
    await db.query('SELECT * FROM support_delivery_watch WHERE order_id=$1', [
      o.order_id
    ])
  ).rows[0];
  assert.equal(w.phase, 'needs_seller');
  assert.equal((await count()).rows[0].n, n + 1);
  const id = randomUUID(),
    at = new Date();
  await event(
    o,
    'delivered',
    'Parcel handed to the synthetic customer.',
    id,
    at
  );
  await event(
    o,
    'delivered',
    'Parcel handed to the synthetic customer.',
    id,
    at
  );
  await assert.rejects(() => event(o, 'exception', 'Changed payload', id, at));
  await tick(o);
  assert.equal(
    (
      await db.query(
        'SELECT phase FROM support_delivery_watch WHERE order_id=$1',
        [o.order_id]
      )
    ).rows[0].phase,
    'resolved'
  );
  const after = (await count()).rows[0].n;
  await tick(o);
  assert.equal((await count()).rows[0].n, after);
  await event(
    o,
    'exception',
    'Old scan arrived late',
    randomUUID(),
    new Date(Date.now() - 7200000)
  );
  await tick(o);
  assert.equal((await count()).rows[0].n, after);
});
test('pause and seller takeover prevent proactive customer updates', async () => {
  const o = await order();
  await watch(o);
  await cases.adminCommand('QA seller', { command: 'stop', paused: true });
  await tick(o);
  assert.equal(
    (
      await db.query(
        'SELECT count(*)::int AS n FROM support_case WHERE order_id=$1',
        [o.order_id]
      )
    ).rows[0].n,
    0
  );
  await cases.adminCommand('QA seller', { command: 'stop', paused: false });
  const { caseId } = await cases.customerCommand(customer.customer_id, {
    command: 'open',
    orderId: o.uuid
  });
  await cases.adminCommand('QA seller', { command: 'takeover', caseId });
  await tick(o);
  assert.equal(
    (
      await db.query(
        'SELECT count(*)::int AS n FROM support_message WHERE case_id=$1',
        [caseId]
      )
    ).rows[0].n,
    1
  );
});
test('delivery answers describe evidence and unknown ETA; conversations return newest messages and preserve older history', async () => {
  const o = await order();
  await db.query('DELETE FROM support_delivery_watch WHERE order_id=$1', [
    o.order_id
  ]);
  const d = await context.deliveryContext(db, o);
  assert.match(context.deliveryAnswer(o, d), /no confirmed delivery estimate/);
  const { caseId } = await cases.customerCommand(customer.customer_id, {
    command: 'open',
    orderId: o.uuid
  });
  for (let i = 0; i < 120; i++)
    await db.query(
      "INSERT INTO support_message(case_id,actor,body,client_key) VALUES($1,'agent',$2,$3)",
      [caseId, `Saved message ${i}`, randomUUID()]
    );
  const latest = await cases.detail(caseId, customer.customer_id);
  assert.equal(latest.messages.length, 100);
  assert.equal(latest.messages.at(-1).body, 'Saved message 119');
  assert.equal(latest.hasEarlier, true);
  const older = await cases.detail(
    caseId,
    customer.customer_id,
    latest.messages[0].message_seq
  );
  assert.equal(older.messages.length, 21);
});

test('courier pickup blocks cancellation and an exception produces a seller brief', async () => {
  const o = await order();
  await watch(o);
  await event(o, 'picked_up', 'Parcel collected.');
  const { caseId } = await cases.customerCommand(customer.customer_id, {
    command: 'open',
    orderId: o.uuid
  });
  await assert.rejects(
    () =>
      runner.quoteCancellation(db, {
        order_id: o.order_id,
        customer_id: customer.customer_id
      }),
    /fulfillment has started/
  );
  await event(
    o,
    'exception',
    'Delivery attempt failed; customer access needs confirmation.'
  );
  decisions.push({ decision: 'seller_review' });
  await tick(o);
  const d = await cases.detail(caseId);
  assert.equal(d.case.status, 'AWAITING_SELLER');
  assert.match(d.brief.facts, /Latest courier evidence: exception/);
  assert.match(d.brief.decision, /recovery plan/);
});
test('conflicting published guidance is withheld and token reservations enforce a ceiling', async () => {
  const k = await import(
    '../extensions/ordex/dist/services/support/knowledge.js'
  );
  const p = await policy();
  const settings = {
    ...p.settings,
    autoAuthorize: true,
    autoReasons: ['Changed my mind']
  };
  assert.ok(
    k.conflicts(
      'Changed my mind returns require seller review before return authorization.',
      settings
    ).length
  );
  const { limits, modelJson } = await import(
    '../extensions/ordex/dist/services/support/model.js'
  );
  const saved = limits.inputTokensMinute;
  limits.inputTokensMinute = 1;
  await assert.rejects(
    () =>
      modelJson(
        'budget test',
        'Return JSON.',
        { text: 'test' },
        { type: 'object' }
      ),
    (e) => e.status === 429
  );
  limits.inputTokensMinute = saved;
});
