# Ordex — Seller Rescue

Ordex is a synthetic online shop built to demonstrate **Seller Rescue**, an AI support agent for small merchants. It investigates order and delivery issues, guides customers through returns, and can carry an eligible refund or cancellation through the store's real application services. A seller can inspect the evidence, approve an exact action, take over a conversation, or hand it back to the agent.

This repository contains the application and local demo setup. The current version has been exercised locally; the complete online web, worker, database, and AI flow still needs to be verified on the hackathon deployment.

## Try the demo locally

Requirements: Node.js 22, npm 10, and PostgreSQL 16.

```sh
npm ci
npm run demo:setup
npm run build
RUN_BACKGROUND_WORKERS=false npm start
```

In a second terminal, start the background worker:

```sh
npm run start:worker
```

Open the storefront at [localhost:3000](http://localhost:3000). `demo:setup` compiles the project, applies migrations, and creates synthetic store data. Without a `.env` file it creates a local `ordex_demo` database using the current PostgreSQL user; set `PGUSER` if needed. To use another database, copy `.env.example` to `.env` and provide its connection settings.

| Demo account | Email | Password | Where to sign in |
| --- | --- | --- | --- |
| Customer — Maya | `maya@ordex.example` | `Explore123!` | Storefront → Sign in |
| Customer — Arjun | `arjun@ordex.example` | `Explore123!` | Storefront → Sign in |
| Seller | `seller@ordex.example` | `DemoStore123!` | [`/admin`](http://localhost:3000/admin) |

These shared credentials are for the seeded local demo only. They do not grant access to a hosted instance. The online demo needs separately provisioned accounts; do not reuse these passwords for deployment.

To enable live model decisions and document review, set `GEMINI_API_KEY` in the server environment. The default model is `gemini-3.8-flash` and can be changed with `SUPPORT_MODEL`. The application has no paid-model fallback or automatic plan upgrade. Temporary provider failures are retried; unsupported answers remain saved for seller review.

## Product features

- **Order support:** a signed-in customer opens a persistent conversation for an order they own. The agent reads current order, item, payment, delivery, and published store-policy evidence.
- **Returns and refunds:** the agent proposes exact items, quantities, reason, and amount. The customer confirms the proposal; the seller records physical receipt and inspection. Only then can an eligible synthetic refund proceed. Damaged returns do not silently restock inventory.
- **Order cancellation:** a fully unshipped order can be canceled after the customer confirms the exact proposal. The demo payment reversal and stock restoration happen once; cases with fulfillment or return activity go to seller review.
- **Delivery watch:** a background worker checks demo dispatch and delivery targets and synthetic courier exceptions, saves follow-up work, and can post a customer update or escalate a seller brief.
- **Seller controls:** review approvals and action history, pause automated work, take over a case, or explicitly hand the conversation back to the agent with private context.
- **Operations view:** agent setup and Health show worker liveness, model results, queued cases, usage, and verified outcomes as separate signals.

## How AI is used

The model interprets the customer's request and selects a **typed next step** from the application's supported actions. It can ask a follow-up question, summarize relevant evidence, prepare a return or cancellation proposal, or wait for a customer or seller decision. PostgreSQL full-text search retrieves published customer-safe store knowledge; private seller notes are kept out of customer answers.

The model does not directly change commerce records or decide whether it has permission to act. Server-side services recheck account ownership, current order state, policy version, customer consent, item quantities, payment balance, cumulative refund limits, inspection, approval, and duplicate protection. Mutations use the existing commerce services and database transactions. The application verifies the resulting ledger or order state before telling the customer an action completed. Provider errors leave the case saved for retry or seller review; there is no silent model switch.

Payments and courier events are simulated. The demo uses synthetic customers, orders, addresses, payment references, and delivery events; it does not make real payments, refunds, courier bookings, or external customer contact.

## Demo walkthrough

For the suggested three-minute judging walkthrough, return/refund and cancellation journeys, delivery-watch example, and six-slide story, see [DEMO.md](DEMO.md). Useful local pages:

| Page | Path |
| --- | --- |
| Customer support | `/account/support` |
| Customer returns | `/account/returns` |
| Seller support and audit | `/admin/support` |
| Delivery watch | `/admin/support?view=delivery` |
| Agent knowledge, permissions, and health | `/admin/agent-setup` |

## Architecture and verification

EverShop 2.3.0 provides the storefront, admin, catalog, inventory, accounts, checkout, orders, and native commerce services. The `extensions/ordex` extension adds returns, support cases, policy and knowledge records, approvals, audit history, and delivery follow-up. PostgreSQL stores application data and worker leases. The web process serves requests; one background worker processes agent and scheduled work.

Compile and build:

```sh
npm run compile:all
npm run typecheck
npm run build
```

`npm run check:release` also runs release-scope and hosting checks plus a source preflight. Database suites create synthetic test data and must run against a disposable database with the worker stopped; see [docs/agent-support.md](docs/agent-support.md) for test setup and operational details. Local checks do not establish hosted readiness.

For a hosted setup, run the same tested revision as a web service and a separate worker, with a persistent PostgreSQL database. Configure secrets only in the host's secret store. Initialize a new hosted database once with a private `ORDEX_ADMIN_PASSWORD` of at least 16 characters, then remove that setup-only variable. Uploaded media still needs shared persistent storage. The hosted worker, database persistence, model access, and full customer-to-refund journey remain to be verified before presenting an online demo.

## Project scope and credits

The active demo scope is catalog, inventory, customers, orders, delivery, synthetic payments, and returns. CMS authoring, blog, page builder, marketing pages, coupons, outbound webhooks, and real payment integrations are disabled in `config/default.json`.

This repository includes EverShop v2.3.0 under GPL-3.0. Its license and upstream notices are preserved. See [UPSTREAM.md](UPSTREAM.md), [LICENSE](LICENSE), [ASSET_CREDITS.md](ASSET_CREDITS.md), and `LICENSES/` for source and asset attribution.
