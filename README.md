# Ordex

A complete demonstration store built on EverShop, with customer accounts, seller administration, synthetic payments and a return-to-refund workflow.

The commerce application is implemented. AI agent and model integrations are not included in this version.

## Run locally

Requirements: Node.js 20.20+ or 22, npm, and PostgreSQL 16.

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

The login forms are prefilled with sample credentials. The customer form also lets you switch between the two demo customers.

| Account          | Email                  | Password        |
| ---------------- | ---------------------- | --------------- |
| Customer — Maya  | `maya@ordex.example`   | `Explore123!`   |
| Customer — Arjun | `arjun@ordex.example`  | `Explore123!`   |
| Seller           | `seller@ordex.example` | `DemoStore123!` |

These are public demonstration accounts. All customer identities, addresses, orders and payment references are synthetic.

## Included functionality

- Product catalog with 15 variants, search, cart, checkout and customer order history.
- Seller product, inventory, customer, order and shipment management.
- Two customer accounts and 12 seeded orders covering delivered, in-transit and unfulfilled states, including an expired return window.
- Customer return requests with item quantities, reasons and notes.
- Seller approval, receipt and inspection, followed by a verified synthetic refund.
- Persistent return history and refund references visible to both customer and seller.
- Duplicate protection for checkout, return submission and refund execution.
- Responsive storefront and seller styling, local fonts and revised sales charts.

To try a return, sign in as Maya, open **Returns & refunds**, select a recent delivered order and submit a request. In the seller studio, open **Returns**, approve the request, record receipt, save an inspection and issue the demo refund. Reopen the customer return to see its status and reference.

Refunds do not automatically restock products. Inspection records whether an item is resellable or damaged; stock remains under the seller's inventory controls.

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
```

The integration checks cover customer isolation, seller authentication, repeated checkout, duplicate and concurrent return/refund requests, inspection requirements, persistence and unchanged inventory after refunds. They create an additional synthetic test order.

`npm run demo:seed` restores missing demo fixtures without deleting existing records. Credentials and connection settings belong in `.env`, which is ignored by Git.

## Source and licenses

The full EverShop source is included under `packages/`. Project-specific commerce functionality is in `extensions/ordex/`.

See [UPSTREAM.md](UPSTREAM.md) for the pinned upstream version and attribution, and [LICENSE](LICENSE) for GPL-3.0. The bundled fonts retain their notices under `LICENSES/`.
