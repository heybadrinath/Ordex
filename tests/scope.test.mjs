import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { before, test } from 'node:test';
import 'dotenv/config';
import config from 'config';
import { getCoreModules } from '../packages/evershop/dist/bin/lib/loadModules.js';
import { ensureRoutesLoaded } from '../packages/evershop/dist/bin/lib/ensureRoutesLoaded.js';
import { getRoutes } from '../packages/evershop/dist/lib/router/Router.js';
import { scanForRoutes } from '../packages/evershop/dist/lib/router/scanForRoutes.js';
import { scanForRootComponents } from '../packages/evershop/dist/lib/componee/scanForRootComponents.js';
import { getComponentsByRoute } from '../packages/evershop/dist/lib/componee/getComponentsByRoute.js';

const base = process.env.TEST_URL || 'http://localhost:3000';
let sellerCookies;

before(async () => {
  ensureRoutesLoaded();
  const response = await fetch(`${base}/admin/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'seller@ordex.example',
      password: 'DemoStore123!'
    })
  });
  assert.equal(response.status, 200);
  sellerCookies = response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
});

test('disabled modules, routes and navigation stay out of the active application', async () => {
  const modules = getCoreModules();
  for (const name of config.get('system.disabledModules')) {
    assert.ok(!modules.some((module) => module.name === name), name);
    assert.ok(
      !getRoutes().some((route) => route.folder.includes(`/modules/${name}/`)),
      name
    );
  }
  const installedRoutes = getCoreModules({ includeDisabled: true }).flatMap(
    (module) =>
      [
        ['pages/admin', true, false],
        ['pages/frontStore', false, false],
        ['api', false, true]
      ].flatMap(([folder, admin, api]) =>
        existsSync(path.join(module.path, folder))
          ? scanForRoutes(path.join(module.path, folder), admin, api)
          : []
      )
  );
  for (const id of config.get('system.disabledRoutes')) {
    assert.ok(
      installedRoutes.some((route) => route.id === id),
      `Unknown disabled route: ${id}`
    );
    assert.ok(
      !getRoutes().some((route) => route.id === id),
      `Route still active: ${id}`
    );
  }
  for (const id of [
    'homepage',
    'productView',
    'checkout',
    'account',
    'orderList',
    'dashboard',
    'orderEdit',
    'sellerReturns',
    'customerReturnPage'
  ]) {
    assert.ok(
      getRoutes().some((route) => route.id === id),
      `Missing commerce route: ${id}`
    );
  }
  const components = await scanForRootComponents();
  components.push(
    ...getComponentsByRoute(
      getRoutes().find((route) => route.id === 'dashboard')
    )
  );
  for (const name of config.get('system.disabledComponents')) {
    assert.ok(
      !components.some((file) => file.endsWith(`/modules/${name}`)),
      name
    );
  }
  for (const name of config.get('system.disabledModules')) {
    assert.ok(
      !components.some((file) => file.includes(`/modules/${name}/`)),
      name
    );
  }
});

test('disabled pages and write APIs return not found even for the seller', async () => {
  for (const url of [
    '/admin/pages',
    '/admin/widgets',
    '/admin/contact-submissions',
    '/admin/page-builder',
    '/admin/blog/posts',
    '/admin/landing-pages',
    '/admin/coupons',
    '/admin/setting/payments',
    '/admin/setting/system',
    '/blog',
    '/about-us',
    '/sitemap.xml',
    '/sitemap-blog-posts.xml'
  ]) {
    const response = await fetch(`${base}${url}`, {
      headers: { Cookie: sellerCookies },
      redirect: 'manual'
    });
    assert.equal(response.status, 404, `${url}: ${response.status}`);
  }
  for (const url of [
    '/api/pages',
    '/api/widgets',
    '/api/contact',
    '/api/coupons',
    '/api/landing-pages',
    '/api/carts/00000000-0000-4000-8000-000000000000/coupons'
  ]) {
    const response = await fetch(`${base}${url}`, {
      method: 'POST',
      headers: { Cookie: sellerCookies, 'Content-Type': 'application/json' },
      body: '{}',
      redirect: 'manual'
    });
    assert.equal(response.status, 404, `${url}: ${response.status}`);
  }
});

test('disabled content and marketing queries are absent from GraphQL', async () => {
  for (const endpoint of ['/api/graphql', '/api/admin/graphql']) {
    const response = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: { Cookie: sellerCookies, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ __type(name: "Query") { fields { name } } }'
      })
    });
    const body = await response.json();
    assert.ok(!body.errors, JSON.stringify(body.errors));
    const fields = body.data.__type.fields.map((field) => field.name);
    for (const name of config.get('system.disabledGraphqlQueries')) {
      assert.ok(!fields.includes(name), `${endpoint}: ${name}`);
    }
    assert.ok(fields.includes('products'));
  }
});

test('the remaining seller pages render with their data', async () => {
  for (const [url, content] of [
    ['/admin', 'Overview'],
    ['/admin/products', 'Products'],
    ['/admin/orders', 'Orders'],
    ['/admin/returns', 'Return requests']
  ]) {
    const response = await fetch(`${base}${url}`, {
      headers: { Cookie: sellerCookies }
    });
    const html = await response.text();
    assert.equal(response.status, 200, url);
    assert.ok(html.includes(content), `${url}: content did not render`);
  }
});

test('store overview data stays private and exposes usable totals', async () => {
  const anonymous = await fetch(`${base}/api/studio/summary`);
  assert.equal(anonymous.status, 401);
  const response = await fetch(`${base}/api/studio/summary`, {
    headers: { Cookie: sellerCookies }
  });
  assert.equal(response.status, 200);
  const { data } = await response.json();
  for (const key of [
    'orders',
    'products',
    'customers',
    'open_returns',
    'delivered'
  ]) {
    assert.ok(Number.isInteger(data[key]) && data[key] >= 0, `Invalid ${key}`);
  }
  assert.ok(data.delivered <= data.orders);
  assert.ok(data.recentOrders.length <= 5);
  for (const order of data.recentOrders) {
    const page = await fetch(`${base}/admin/order/edit/${order.uuid}`, {
      headers: { Cookie: sellerCookies }
    });
    assert.equal(page.status, 200);
  }
});
