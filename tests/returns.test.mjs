import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';

const base = process.env.TEST_URL || 'http://localhost:3000';
let pool, fixture, otherOrder, customerCookies, sellerCookies;

async function call(path, { cookies = '', body, method } = {}) {
  const response = await fetch(`${base}${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  return {
    status: response.status,
    data,
    cookies: response.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ')
  };
}

before(async () => {
  process.env.NODE_ENV = 'development';
  process.env.ALLOW_CONFIG_MUTATIONS = 'true';
  ({ pool } = await import(
    '../packages/evershop/dist/lib/postgres/connection.js'
  ));
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
    { path: `${process.cwd()}/extensions/ordex/dist` }
  ])
    await loadBootstrapScript(m, {
      command: 'seed',
      env: 'test',
      process: 'main'
    });
  const { createNewCart, saveCart, checkout } = await import(
    '@evershop/evershop/checkout/services'
  );
  const { createShipment, markDelivered } = await import(
    '@evershop/evershop/oms/services'
  );
  const customer = (
    await pool.query("SELECT * FROM customer WHERE email='maya@ordex.example'")
  ).rows[0];
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
  const product = (
    await pool.query("SELECT * FROM product WHERE sku='CUP-001-WHT'")
  ).rows[0];
  const shipping = (
    await pool.query(
      "SELECT uuid FROM core_shipping_method WHERE name='Standard delivery'"
    )
  ).rows[0];
  const cart = await createNewCart(randomUUID(), customer);
  await cart.addItem(product.product_id, 2, {});
  await saveCart(cart);
  fixture = await checkout(cart.getData('uuid'), {
    shippingAddress: address,
    billingAddress: address,
    paymentMethod: 'demo',
    shippingMethod: shipping.uuid,
    shippingProvider: 'core'
  });
  fixture.cartUuid = cart.getData('uuid');
  fixture.item = (
    await pool.query('SELECT * FROM order_item WHERE order_item_order_id=$1', [
      fixture.order_id
    ])
  ).rows[0];
  const { shipment } = await createShipment(fixture.uuid, {
    carrier: 'demo',
    items: [{ order_item_id: fixture.item.order_item_id, qty: 2 }]
  });
  await markDelivered(shipment.uuid);
  otherOrder = (
    await pool.query(
      'SELECT o.uuid FROM "order" o JOIN customer c ON c.customer_id=o.customer_id WHERE c.email=\'arjun@ordex.example\' LIMIT 1'
    )
  ).rows[0];
  const customerLogin = await call('/customer/login', {
    body: { email: 'maya@ordex.example', password: 'Explore123!' }
  });
  assert.equal(customerLogin.status, 200);
  assert.ok(!customerLogin.data.error, JSON.stringify(customerLogin.data));
  customerCookies = customerLogin.cookies;
  const sellerLogin = await call('/admin/user/login', {
    body: { email: 'seller@ordex.example', password: 'DemoStore123!' }
  });
  assert.equal(sellerLogin.status, 200);
  assert.ok(!sellerLogin.data.error, JSON.stringify(sellerLogin.data));
  sellerCookies = sellerLogin.cookies;
});
after(async () => {
  await pool?.end();
});

test('a completed checkout cannot create a second payment', async () => {
  const { checkout } = await import('@evershop/evershop/checkout/services');
  await assert.rejects(
    () => checkout(fixture.cartUuid, { paymentMethod: 'demo' }),
    /Cart not found/
  );
  const result = await pool.query(
    "SELECT count(*) FROM demo_payment WHERE order_id=$1 AND kind='payment'",
    [fixture.order_id]
  );
  assert.equal(Number(result.rows[0].count), 1);
});

test('customer data and seller mutations require the correct login', async () => {
  assert.equal((await call('/api/returns/customer')).status, 401);
  assert.equal(
    (await call('/api/returns/admin', { cookies: customerCookies })).status,
    401
  );
  const result = await call('/api/returns/customer', {
    cookies: customerCookies
  });
  assert.equal(result.status, 200);
  assert.ok(!result.data.data.orders.some((o) => o.uuid === otherOrder.uuid));
  assert.equal(
    (
      await call('/api/returns/customer', {
        cookies: customerCookies,
        body: {
          orderId: otherOrder.uuid,
          requestKey: randomUUID(),
          reason: 'Other',
          items: [{ id: fixture.item.order_item_id, qty: 1 }]
        }
      })
    ).status,
    404
  );
});

test('return lifecycle is persistent, duplicate-safe and separate from stock', async () => {
  const stockBefore = (
    await pool.query(
      'SELECT qty FROM product_inventory WHERE product_inventory_product_id=$1',
      [fixture.item.product_id]
    )
  ).rows[0].qty;
  const payload = {
    orderId: fixture.uuid,
    requestKey: randomUUID(),
    reason: 'Not as expected',
    note: 'Automated demonstration verification',
    items: [{ id: fixture.item.order_item_id, qty: 1 }]
  };
  const duplicates = await Promise.all([
    call('/api/returns/customer', { cookies: customerCookies, body: payload }),
    call('/api/returns/customer', { cookies: customerCookies, body: payload })
  ]);
  duplicates.forEach((r) =>
    assert.equal(r.status, 201, JSON.stringify(r.data))
  );
  const id = duplicates[0].data.data.return_id;
  assert.equal(duplicates[1].data.data.return_id, id);
  assert.equal(
    (
      await call('/api/returns/customer', {
        cookies: customerCookies,
        body: { ...payload, note: 'changed' }
      })
    ).status,
    409
  );
  assert.equal(
    (
      await call('/api/returns/customer', {
        cookies: customerCookies,
        body: {
          ...payload,
          requestKey: randomUUID(),
          items: [{ id: fixture.item.order_item_id, qty: 2 }]
        }
      })
    ).status,
    400
  );
  const action = (body) =>
    call(`/api/returns/admin/${id}`, { cookies: sellerCookies, body });
  assert.equal((await action({ action: 'refund' })).status, 409);
  for (const name of ['approve', 'receive'])
    assert.equal((await action({ action: name })).status, 200);
  assert.equal(
    (
      await action({
        action: 'inspect',
        condition: 'damaged',
        note: 'Confirmed damage to rim.'
      })
    ).status,
    200
  );
  const refunds = await Promise.all([
    action({ action: 'refund' }),
    action({ action: 'refund' })
  ]);
  refunds.forEach((r) => assert.equal(r.status, 200, JSON.stringify(r.data)));
  assert.equal(
    refunds[0].data.data.refund_transaction_id,
    refunds[1].data.data.refund_transaction_id
  );
  assert.equal(
    Number(
      (
        await pool.query(
          "SELECT count(*) FROM demo_payment WHERE operation_key=$1 AND kind='refund'",
          [id]
        )
      ).rows[0].count
    ),
    1
  );
  assert.equal(
    Number(
      (
        await pool.query(
          'SELECT count(*) FROM payment_transaction WHERE transaction_id=$1',
          [`demo-refund-${id}`]
        )
      ).rows[0].count
    ),
    1
  );
  assert.equal(
    (
      await pool.query(
        'SELECT qty FROM product_inventory WHERE product_inventory_product_id=$1',
        [fixture.item.product_id]
      )
    ).rows[0].qty,
    stockBefore
  );
  const persisted = await call('/api/returns/customer', {
    cookies: customerCookies
  });
  assert.equal(
    persisted.data.data.returns.find((r) => r.return_id === id).status,
    'refunded'
  );
  assert.equal(
    persisted.data.data.orders.find((o) => o.uuid === fixture.uuid).items[0].remaining_qty,
    1
  );
});

test('the customer return page is reachable and requires customer login', async () => {
  const anonymous = await fetch(`${base}/account/returns`, { redirect: 'manual' });
  assert.equal(anonymous.status, 302);
  assert.ok(anonymous.headers.get('location').includes('/account/login'));
  const customer = await fetch(`${base}/account/returns`, {
    headers: { Cookie: customerCookies }
  });
  assert.equal(customer.status, 200);
  assert.match(await customer.text(), /A little care, after checkout/);
});
