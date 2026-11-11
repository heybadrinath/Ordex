import 'dotenv/config';
process.env.NODE_ENV = 'development';
process.env.ALLOW_CONFIG_MUTATIONS = 'true';

const { pool } = await import('../packages/evershop/dist/lib/postgres/connection.js');
const { ensureRoutesLoaded } = await import('../packages/evershop/dist/bin/lib/ensureRoutesLoaded.js');
const { getCoreModules } = await import('../packages/evershop/dist/bin/lib/loadModules.js');
const { loadBootstrapScript } = await import('../packages/evershop/dist/bin/lib/bootstrap/bootstrap.js');
ensureRoutesLoaded();
for (const module of [...getCoreModules(), { path: `${process.cwd()}/extensions/ordex/dist` }]) {
  await loadBootstrapScript(module, { command: 'seed', env: 'development', process: 'main' });
}
const { createCustomer, createCustomerAddress } = await import('@evershop/evershop/customer/services');
const { createNewCart, saveCart, checkout } = await import('@evershop/evershop/checkout/services');
const { createShipment, markDelivered } = await import('@evershop/evershop/oms/services');
const { createReturn, updateReturn } = await import('../extensions/ordex/dist/services/returns.js');

// Fixture keys make reruns additive; existing orders and customer edits are retained.
const names = ['Nina Patel', 'Kabir Mehta', 'Isha Kapoor', 'Rohan Das', 'Leela Nair', 'Dev Malhotra', 'Sara Khan', 'Aarav Joshi', 'Tara Sen', 'Neel Shah', 'Anika Rao', 'Vikram Bose', 'Zoya Ali', 'Sameer Roy', 'Mira Jain', 'Kiran Sethi'];
const customers = [];
const day = 86400000;
const anchor = new Date();
anchor.setUTCHours(8, 0, 0, 0);
const method = (await pool.query("SELECT uuid FROM core_shipping_method WHERE name='Standard delivery' AND is_enabled=true LIMIT 1")).rows[0];
if (!method) throw new Error('Run demo setup first: Standard delivery is required.');
const lock = await pool.connect();
try {
  await lock.query("SELECT pg_advisory_lock(hashtext('ordex-history-fixtures'))");
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const email = `${name.toLowerCase().replaceAll(' ', '.')}@ordex.example`;
    let customer = (await pool.query('SELECT * FROM customer WHERE email=$1', [email])).rows[0];
    const address = { given_name: name.split(' ')[0], family_name: name.split(' ')[1], address_line_1: `${30 + i} Sample Lane`, address_line_2: 'Demo Gardens', locality: 'Bengaluru', administrative_area: 'IN-KA', country: 'IN', postal_code: '560001', telephone: '+919000000000', is_default: true };
    if (!customer) {
      customer = await createCustomer({ email, full_name: name, password: 'Explore123!' });
      await createCustomerAddress(customer.uuid, address, {});
      await pool.query('UPDATE customer SET created_at=$2 WHERE customer_id=$1', [customer.customer_id, new Date(anchor - (60 - i) * day)]);
    }
    customers.push({ customer, address });
  }
  let added = 0;
  for (let i = 0; i < 72; i++) {
    const key = `ordex-history-v1-${i + 1}`;
    if ((await pool.query('SELECT 1 FROM "order" WHERE integration_order_id=$1', [key])).rowCount) continue;
    const { customer, address } = customers[i < 16 ? i : (i * 7) % 12];
    const products = (await pool.query(`SELECT p.product_id FROM product p JOIN product_inventory inv ON inv.product_inventory_product_id=p.product_id WHERE p.status=true AND inv.qty>=5 ORDER BY p.product_id`)).rows;
    if (products.length < 3) throw new Error('Not enough stocked demo products for order history.');
    const cart = await createNewCart(key, customer);
    const lineCount = 1 + (i % 3);
    for (let line = 0; line < lineCount; line++) {
      await cart.addItem(products[(i * 5 + line * 11) % products.length].product_id, line === 0 && i % 5 === 0 ? 2 : 1, {});
    }
    await saveCart(cart);
    const order = await checkout(cart.getData('uuid'), { shippingAddress: address, billingAddress: address, shippingMethod: method.uuid, shippingProvider: 'core', paymentMethod: 'demo', customer: { id: customer.customer_id, email: customer.email, fullName: customer.full_name } });
    // Date only the new synthetic records. All operational transitions use native services.
    const age = i < 16 ? 45 - i : i >= 60 ? (i % 3) : 4 + ((i * 13) % 26);
    const placed = new Date(anchor - age * day + (i % 7) * 3600000);
    await pool.query('UPDATE "order" SET integration_order_id=$2, created_at=$3 WHERE order_id=$1', [order.order_id, key, placed]);
    const items = (await pool.query('SELECT order_item_id,qty FROM order_item WHERE order_item_order_id=$1 ORDER BY order_item_id', [order.order_id])).rows;
    const pending = i >= 60 && i % 3 === 0;
    const shipped = i >= 60 && i % 3 === 1;
    if (!pending) {
      const { shipment } = await createShipment(order.uuid, { carrier: 'demo', tracking_number: `DEMO-H${String(i + 1).padStart(3, '0')}`, items });
      if (!shipped) await markDelivered(shipment.uuid);
      const delivered = new Date(Math.min(placed.getTime() + 2 * day, anchor.getTime()));
      await pool.query('UPDATE shipment SET created_at=$2,shipped_at=$3,delivered_at=$4 WHERE shipment_id=$1', [shipment.shipment_id, placed, new Date(placed.getTime() + day / 2), shipped ? null : delivered]);
      if (i >= 48 && i < 60) {
        // Create inside the return window, then date the completed fixture history.
        await pool.query('UPDATE shipment SET delivered_at=now() WHERE shipment_id=$1', [shipment.shipment_id]);
        const reasons = ['Arrived damaged', 'Not as expected', 'Wrong item', 'Changed my mind'];
        const returned = await createReturn(customer.customer_id, { orderId: order.uuid, reason: reasons[i % 4], note: 'Synthetic order history for exploring the return workflow.', requestKey: key, items: [{ id: items[0].order_item_id, qty: 1 }] });
        const stage = i % 6;
        if (stage >= 1) await updateReturn(returned.return_id, 'approve', {}, 'Ordex Studio');
        if (stage >= 2) await updateReturn(returned.return_id, 'receive', {}, 'Ordex Studio');
        if (stage >= 3) await updateReturn(returned.return_id, 'inspect', { condition: i % 2 ? 'resellable' : 'damaged', note: 'Synthetic inspection: condition checked.' }, 'Ordex Studio');
        if (stage >= 4) await updateReturn(returned.return_id, 'refund', {}, 'Ordex Studio');
        const requestedAt = new Date(delivered.getTime() + 3600000);
        await pool.query('UPDATE customer_return SET created_at=$2::timestamptz,updated_at=$2::timestamptz,received_at=CASE WHEN received_at IS NOT NULL THEN $2::timestamptz ELSE NULL END,inspected_at=CASE WHEN inspected_at IS NOT NULL THEN $2::timestamptz ELSE NULL END,refunded_at=CASE WHEN refunded_at IS NOT NULL THEN $2::timestamptz ELSE NULL END WHERE return_id=$1', [returned.return_id, requestedAt]);
        await pool.query('UPDATE return_activity SET created_at=$2::timestamptz + (activity_id % 6) * interval \'1 minute\' WHERE return_id=$1', [returned.return_id, requestedAt]);
        await pool.query('UPDATE shipment SET delivered_at=$2 WHERE shipment_id=$1', [shipment.shipment_id, delivered]);
      }
    }
    // Native activity records remain in chronological order with their fixture order.
    await pool.query('UPDATE order_activity SET created_at=$2::timestamptz + (order_activity_id % 10) * interval \'1 minute\' WHERE order_activity_order_id=$1', [order.order_id, placed]);
    added++;
    console.log(`History ${i + 1}/72: ${order.order_number}`);
  }
  console.log(JSON.stringify({ added, totals: (await pool.query('SELECT (SELECT count(*) FROM "order") AS orders,(SELECT count(*) FROM customer) AS customers,(SELECT count(*) FROM customer_return WHERE status NOT IN (\'refunded\',\'rejected\')) AS open_returns')).rows[0] }));
} finally {
  await lock.query("SELECT pg_advisory_unlock(hashtext('ordex-history-fixtures'))");
  lock.release();
  await pool.end();
}
