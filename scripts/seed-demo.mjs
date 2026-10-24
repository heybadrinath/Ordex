import 'dotenv/config';
process.env.NODE_ENV = 'development';
process.env.ALLOW_CONFIG_MUTATIONS = 'true';
const { pool } = await import(
  '../packages/evershop/dist/lib/postgres/connection.js'
);
const { ensureRoutesLoaded } = await import(
  '../packages/evershop/dist/bin/lib/ensureRoutesLoaded.js'
);
ensureRoutesLoaded();
const { getCoreModules } = await import(
  '../packages/evershop/dist/bin/lib/loadModules.js'
);
const { migrate } = await import(
  '../packages/evershop/dist/bin/lib/bootstrap/migrate.js'
);
await migrate([
  { name: 'ordex', path: `${process.cwd()}/extensions/ordex/dist` }
]);
const { loadBootstrapScript } = await import(
  '../packages/evershop/dist/bin/lib/bootstrap/bootstrap.js'
);
for (const module of [
  ...getCoreModules(),
  { path: `${process.cwd()}/extensions/ordex/dist` }
]) {
  await loadBootstrapScript(module, {
    command: 'seed',
    env: 'development',
    process: 'main'
  });
}
const { createCustomer, createCustomerAddress } = await import(
  '@evershop/evershop/customer/services'
);
const { createNewCart, saveCart, checkout } = await import(
  '@evershop/evershop/checkout/services'
);
const { updateProduct } = await import('@evershop/evershop/catalog/services');
const { createShipment, markDelivered, updateShipmentStatusFromCarrier } =
  await import('@evershop/evershop/oms/services');
const { createReturn, updateReturn } = await import(
  '../extensions/ordex/dist/services/returns.js'
);

const customers = [];
for (const [email, name] of [
  ['maya@ordex.example', 'Maya Shah'],
  ['arjun@ordex.example', 'Arjun Rao']
]) {
  let customer = (
    await pool.query('SELECT * FROM customer WHERE email=$1', [email])
  ).rows[0];
  if (!customer)
    customer = await createCustomer({
      email,
      full_name: name,
      password: 'Explore123!'
    });
  const address = {
    given_name: name.split(' ')[0],
    family_name: name.split(' ')[1],
    address_line_1: '24 Sample Lane',
    address_line_2: 'Demo Gardens',
    locality: 'Bengaluru',
    administrative_area: 'IN-KA',
    country: 'IN',
    postal_code: '560001',
    telephone: '+919000000000',
    is_default: true
  };
  if (
    !(
      await pool.query('SELECT 1 FROM customer_address WHERE customer_id=$1', [
        customer.customer_id
      ])
    ).rowCount
  ) {
    await createCustomerAddress(customer.uuid, address, {});
  }
  customers.push({ customer, address });
}
const catalogCategory = (
  await pool.query(
    "SELECT category_description_category_id AS id FROM category_description WHERE url_key='accessories' LIMIT 1"
  )
).rows[0];
const catalogTaxClass = (
  await pool.query(
    'SELECT tax_class_id AS id FROM tax_class ORDER BY tax_class_id LIMIT 1'
  )
).rows[0];
const prices = { CUP: 590, PEN: 450, BOWL: 690, VASE: 990, THERMO: 1490 };
const { rows: products } = await pool.query(
  'SELECT * FROM product ORDER BY product_id'
);
for (const product of products) {
  const price = prices[product.sku.split('-')[0]];
  if (price)
    await updateProduct(product.uuid, {
      price,
      category_id: catalogCategory?.id || product.category_id,
      tax_class: product.tax_class || catalogTaxClass?.id
    });
}
const { seedCatalog } = await import('./seed-catalog.mjs');
await seedCatalog(pool);
await pool.query(
  "UPDATE collection SET name='Everyday favourites' WHERE code='homepage'"
);
await pool.query(
  "UPDATE widget_instance SET status=false WHERE name='Demo Main Menu'"
);

let zone = (await pool.query("SELECT * FROM shipping_zone WHERE name='India'"))
  .rows[0];
if (!zone)
  zone = (
    await pool.query(
      "INSERT INTO shipping_zone(name) VALUES('India') RETURNING *"
    )
  ).rows[0];
await pool.query(
  "INSERT INTO shipping_zone_country(zone_id,country) VALUES($1,'IN') ON CONFLICT DO NOTHING",
  [zone.shipping_zone_id]
);
await pool.query(
  "INSERT INTO shipping_zone_provider(zone_id,provider_code,is_enabled) VALUES($1,'core',true) ON CONFLICT DO NOTHING",
  [zone.shipping_zone_id]
);
let method = (
  await pool.query(
    "SELECT * FROM core_shipping_method WHERE name='Standard delivery'"
  )
).rows[0];
if (!method)
  method = (
    await pool.query(
      "INSERT INTO core_shipping_method(name,is_enabled,default_carrier_code) VALUES('Standard delivery',true,'demo') RETURNING *"
    )
  ).rows[0];
await pool.query(
  'INSERT INTO core_shipping_method_rate(method_id,zone_id,is_enabled,cost) VALUES($1,$2,true,0) ON CONFLICT(method_id,zone_id) DO NOTHING',
  [method.core_shipping_method_id, zone.shipping_zone_id]
);

for (let index = 0; index < 12; index++) {
  const fixtureKey = `ordex-fixture-${index + 1}`;
  if (
    (
      await pool.query('SELECT 1 FROM "order" WHERE integration_order_id=$1', [
        fixtureKey
      ])
    ).rowCount
  )
    continue;
  const { customer, address } = customers[index === 7 ? 1 : 0];
  const cart = await createNewCart(fixtureKey, customer);
  await cart.addItem(
    products[index % products.length].product_id,
    index === 2 ? 2 : 1,
    {}
  );
  await saveCart(cart);
  const order = await checkout(cart.getData('uuid'), {
    shippingAddress: address,
    billingAddress: address,
    shippingMethod: method.uuid,
    shippingProvider: 'core',
    paymentMethod: 'demo',
    customer: {
      id: customer.customer_id,
      email: customer.email,
      fullName: customer.full_name
    }
  });
  await pool.query(
    'UPDATE "order" SET integration_order_id=$2,order_number=$3,created_at=now()-($4::int*interval \'1 day\') WHERE order_id=$1',
    [
      order.order_id,
      fixtureKey,
      `DX-${1041 + index}`,
      index < 5 ? index + 1 : index + 3
    ]
  );
  const { rows: items } = await pool.query(
    'SELECT * FROM order_item WHERE order_item_order_id=$1',
    [order.order_id]
  );
  if (index !== 4) {
    const { shipment } = await createShipment(order.uuid, {
      carrier: 'demo',
      tracking_number: `DEMO-${1041 + index}`,
      items: items.map((i) => ({ order_item_id: i.order_item_id, qty: i.qty }))
    });
    if (index !== 5) {
      await markDelivered(shipment.uuid);
      await pool.query(
        "UPDATE shipment SET delivered_at=now()-($2::int*interval '1 day') WHERE shipment_id=$1",
        [shipment.shipment_id, index === 6 ? 14 : 1 + (index % 3)]
      );
    }
  }
  if (index === 2 || index === 3) {
    const returned = await createReturn(customer.customer_id, {
      orderId: order.uuid,
      reason: index === 2 ? 'Arrived damaged' : 'Not as expected',
      note: 'Sample return for exploring the seller workflow.',
      requestKey: fixtureKey,
      items: [{ id: items[0].order_item_id, qty: 1 }]
    });
    await updateReturn(returned.return_id, 'approve', {}, 'Ordex Studio');
    if (index === 3) {
      await updateReturn(returned.return_id, 'receive', {}, 'Ordex Studio');
      await updateReturn(
        returned.return_id,
        'inspect',
        { condition: 'resellable', note: 'Packaging intact and item checked.' },
        'Ordex Studio'
      );
      await updateReturn(returned.return_id, 'refund', {}, 'Ordex Studio');
    }
  }
}
// Add a small spread of native orders for the expanded catalog, once per fixture.
const { products: curatedProducts } = JSON.parse(
  await (
    await import('node:fs/promises')
  ).readFile(new URL('../seed/catalog.json', import.meta.url), 'utf8')
);
for (let index = 0; index < 18; index++) {
  const fixtureKey = `ordex-catalog-order-${index + 1}`;
  if (
    (
      await pool.query('SELECT 1 FROM "order" WHERE integration_order_id=$1', [
        fixtureKey
      ])
    ).rowCount
  )
    continue;
  const item = curatedProducts[index % curatedProducts.length];
  const product = (
    await pool.query('SELECT product_id FROM product WHERE sku=$1', [item.sku])
  ).rows[0];
  const { customer, address } = customers[index % 2];
  const cart = await createNewCart(fixtureKey, customer);
  await cart.addItem(product.product_id, index % 7 === 0 ? 2 : 1, {});
  await saveCart(cart);
  const order = await checkout(cart.getData('uuid'), {
    shippingAddress: address,
    billingAddress: address,
    shippingMethod: method.uuid,
    shippingProvider: 'core',
    paymentMethod: 'demo',
    customer: {
      id: customer.customer_id,
      email: customer.email,
      fullName: customer.full_name
    }
  });
  const age = 1 + (index % 15);
  await pool.query(
    `UPDATE "order" SET integration_order_id=$2, order_number=$3, created_at=now()-($4::int*interval '1 day') WHERE order_id=$1`,
    [order.order_id, fixtureKey, `DX-${2001 + index}`, age]
  );
  if (index % 5 !== 0) {
    const items = (
      await pool.query(
        'SELECT order_item_id,qty FROM order_item WHERE order_item_order_id=$1',
        [order.order_id]
      )
    ).rows;
    const { shipment } = await createShipment(order.uuid, {
      carrier: 'demo',
      tracking_number: `DEMO-${2001 + index}`,
      items
    });
    if (index % 4 !== 0) {
      await markDelivered(shipment.uuid);
      await pool.query(
        `UPDATE shipment SET delivered_at=now()-($2::int*interval '1 day') WHERE shipment_id=$1`,
        [shipment.shipment_id, Math.max(0, age - 2)]
      );
    }
  }
}
const catalogCount = (
  await pool.query('SELECT COUNT(*)::int AS count FROM product')
).rows[0].count;
console.log(
  `Demo ready: ${catalogCount} catalog items, two demo customers, 30 order fixtures and sample returns.`
);
await pool.end();
