# Ordex

A demonstration store built on EverShop, focused on customer accounts, seller operations, synthetic payments and a return-to-refund workflow.

The commerce application is implemented. AI agent and model integrations are not included in this version.

## Run locally

Requirements: Node.js 22, npm 10, and PostgreSQL 16.

```sh
npm ci
npm run demo:setup
npm run build
npm start
```

`demo:setup` compiles the source, creates an `ordex_demo` database using your local PostgreSQL user when `.env` is absent, runs migrations and seeds the store. PostgreSQL must already be running. Set `PGUSER` if your database administrator account differs from your operating-system account. Alternatively, copy `.env.example` to `.env` and supply an existing empty database before running setup.

- Storefront: http://localhost:3000
- Customer account: http://localhost:3000/account/login
- Customer returns: http://localhost:3000/account/returns
- Seller studio: http://localhost:3000/admin
- Seller returns: http://localhost:3000/admin/returns

The customer login form is prefilled and lets you switch between the two demo customers. Enter the seller credentials manually. These defaults apply to local setup only.

| Account          | Email                  | Password        |
| ---------------- | ---------------------- | --------------- |
| Customer — Maya  | `maya@ordex.example`   | `Explore123!`   |
| Customer — Arjun | `arjun@ordex.example`  | `Explore123!`   |
| Seller           | `seller@ordex.example` | `DemoStore123!` |

These are public demonstration accounts. All customer identities, addresses, orders and payment references are synthetic.

## Hosted deployment

Northflank's Heroku buildpack runs `npm run heroku-build`; the web process runs `npm start`. Build without database credentials. At runtime, provide `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE=verify-full`, a private `SESSION_SECRET`, `NODE_ENV=production` and the public service's `PORT`.

Set `RUN_BACKGROUND_WORKERS=false` on the web service and run `npm run start:worker` as a second service using the same build and database. This keeps the native scheduled jobs and event subscribers online without fitting all three processes into one small container. The worker has no public port and must run as a single instance. Both services need access to the same runtime secrets.

Initialize a new hosted database once with `node scripts/setup-demo.mjs`. Set `ORDEX_ADMIN_PASSWORD` to a private password of at least 16 characters for this setup job. Production setup rejects the public local password and never creates a local database. The setup does not reset an existing seller's password. Remove this setup-only secret after initialization. Optionally run `npm run demo:history` to add the extended synthetic order history.

Do not run setup on every web startup. Regular starts apply schema migrations but preserve store records. Uploaded media uses local container storage unless an external storage provider or persistent volume is configured; bundled catalog photography survives deployments. Agent features are not part of this deployment.

## Included functionality

- Product catalog with 48 SKUs across everyday essentials and ten categories, search, cart, checkout and customer order history.
- Seller product, inventory, customer, order and shipment management.
- Two customer accounts and 30 seeded orders covering delivered, in-transit and unfulfilled states, including an expired return window.
- Customer return requests with item quantities, reasons and notes.
- Seller approval, receipt and inspection, followed by a verified synthetic refund.
- Persistent return history and refund references visible to both customer and seller.
- Duplicate protection for checkout, return submission and refund execution.
- Responsive storefront and seller styling, local fonts and revised sales charts.

To try a return, sign in as Maya, open **Returns & refunds**, select a recent delivered order and submit a request. In the seller studio, open **Returns**, approve the request, record receipt, save an inspection and issue the demo refund. Reopen the customer return to see its status and reference.

Refunds do not automatically restock products. Inspection records whether an item is resellable or damaged; stock remains under the seller's inventory controls.

## Active scope

Catalog, stock, customer accounts, orders, delivery, demo payments and returns are enabled. CMS editing, page builder, blog, contact forms, marketing landing pages, coupons, outbound webhooks and real payment integrations are disabled in the UI and backend.

The scope is defined in `config/default.json`. Disabled modules do not load their routes, components, GraphQL schemas, event handlers or scheduled jobs. Disabled management routes return 404, and their content queries are absent from GraphQL. Shared image handling, storefront rendering and price calculations remain available. Existing records and upstream source are retained.

## Payment and notification boundaries

Checkout uses the built-in project demo payment method. No card details, payment-provider account or real charge is involved. Payment and refund records are persisted in PostgreSQL and reflected in the native order history. Emails are captured locally as demonstration records; no external messages are sent.

## Development and verification

After changing source files:

```sh
npm run compile:all
npm run build
npm start
```

With the application running, verify the return and payment boundary:

```sh
npm run test:returns
npm run test:scope
```

The integration checks cover customer isolation, seller authentication, repeated checkout, duplicate and concurrent return/refund requests, inspection requirements, persistence and unchanged inventory after refunds. They create an additional synthetic test order.

The scope checks verify that disabled screens and APIs remain inaccessible while the commerce routes are present.

`npm run demo:seed` restores missing demo fixtures without deleting existing records. Credentials and connection settings belong in `.env`, which is ignored by Git.

## Interface and sample catalog

The storefront, customer account and seller workspace share a cobalt, orange and lavender visual theme with locally hosted DM Sans and Manrope. Admin lists, editors, settings and returns use coloured work panels, compact tables and clear action states. The seller overview shows stored order totals, catalog counts, recent orders and return activity. Product pages include delivery and return details; customer accounts keep orders, addresses and return requests together.

The curated catalog in `seed/catalog.json` defines 33 photographed products, nine categories and eight collections, alongside the original 15 variant SKUs and accessories category. `npm run demo:seed` loads the catalog and 30 native order fixtures. The homepage includes category browsing, four collection tabs, stationery, tableware and weekend edits, a workspace feature, an under-₹2,000 collection and shopping information. Product photography is bundled locally with its source links in [ASSET_CREDITS.md](ASSET_CREDITS.md). Rerunning the seed updates this sample catalog without resetting inventory or deleting order history. The desktop cursor uses local SVG assets; text inputs and touch devices retain native controls.

## Demo form defaults

New product, category, collection, attribute, package and shipping-method forms start with editable sample values. New customer addresses and registration forms are also prefilled; return requests select an eligible order and item when available. Existing records and edited values are preserved. Nothing submits automatically: checkout, shipment, receipt, inspection and refund each retain their own explicit action.

Direct product links preselect the displayed variant, and checkout requests shipping quotes when the prefilled address is ready. Review the selected details before saving. These defaults are intended for this synthetic demonstration store.

## Source and licenses

The full EverShop source is included under `packages/`. Project-specific commerce functionality is in `extensions/ordex/`.

See [UPSTREAM.md](UPSTREAM.md) for the pinned upstream version and attribution, and [LICENSE](LICENSE) for GPL-3.0. The bundled fonts retain their notices under `LICENSES/`.
