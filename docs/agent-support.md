# Support agent

The agent uses the existing application, PostgreSQL database and worker. There is no extra model server, vector database or queue service. Commerce, payments, returns and delivery data remain synthetic.

## Run locally

Use Node 22. Put `GEMINI_API_KEY` in the ignored `.env` file. The default model is `gemini-3.8-flash`; do not enable billing or a paid fallback. Keep the key out of browser configuration.

```sh
npm run compile:all
npm run build
PORT=3001 RUN_BACKGROUND_WORKERS=false npm start
```

In a second terminal:

```sh
npm run start:worker
```

The web process applies the additive support migration before serving requests. Start it before the worker on a new database. Existing commerce records are preserved.

- Customer: `/account/support`, or **Get help with this order** on an order.
- Seller: `/admin/support`, including the approvals queue and audit log.
- Knowledge and permissions: `/admin/agent-setup`.

Local sample accounts are `maya@ordex.example` / `Explore123!` and `seller@ordex.example` / `DemoStore123!`. These are synthetic local credentials. Hosted seller credentials remain separate.

## What happens

1. A signed-in customer opens a case for their own order. Reopening an order keeps the same conversation, actions and refund history.
2. The worker reads order facts and retrieves published customer-safe passages using PostgreSQL full-text search. Gemini selects a typed next step. Arbitrary model prose cannot claim an operation completed.
3. A return proposal contains exact items, quantities, reason, amount and policy version. The customer confirms its hash before the worker can create a native return.
4. Eligible damaged/wrong-item returns can be authorized automatically. Other reasons need an exact seller decision. The existing Returns workspace records physical receipt and inspection.
5. The worker rechecks the current policy, customer consent, inspection, paid amount and cumulative commitments. Within the configured limit it performs the synthetic refund; otherwise it waits for seller approval. Approval expires after 15 minutes.
6. Native return, payment-ledger updates, action state, audit entries and the customer receipt commit together. The receipt is checked against the payment ledger before the case resolves. Refunds do not restock inventory.

Seller takeover pauses automated replies and writes. Approval alone does not release seller control. **Hand back to agent** records private seller context and queues continuation; **Approve and hand back** explicitly combines both operations. Emergency pause stops new automatic commits. Private handback notes are shown only to the seller and agent.

## Knowledge

Paste text or upload TXT, Markdown, text-based PDF or DOCX. Limits are 3 MB, 30 PDF pages and 24,000 extracted characters. A short-lived, memory-capped parser process handles documents, one at a time. Scans, protected files, macros and unsupported formats fail visibly.

Sources remain drafts until analysis, clarification and explicit seller publication. Review the interpreted text and source quotations before publishing. Public and internal material are separate; internal raw notes never enter customer generation. Publishing knowledge cannot change permissions. Permission changes invalidate pending actions and approvals while preserving completed operations.

The Test view previews retrieval and policy decisions without changing commerce. Selecting a ready public draft in Knowledge also allows its passages to be previewed before publication.

## Limits and operations

- One concurrent model request across workers, enforced with a PostgreSQL advisory lock.
- Application ceiling: 12 requests/minute, 360/day and 40 per case across resumptions. Account quotas are shared with other use of the same Google project.
- One model decision per conversational run; deterministic continuation needs no model request. Model requests time out after 25 seconds; contexts and outputs are bounded.
- Interactive queue polling every three seconds. Unchanged physical-return waits do not repeatedly call the model or create runs.
- Saved leases allow interrupted work to be reclaimed. New customer input, takeover and policy changes invalidate stale runs.
- Audit rows retain decisions, action payloads, policy versions, approvals, receipts, usage and timing. Runtime logs contain event and case/run identifiers. Neither log stores credentials or hidden reasoning.

The present online foundation has separate 512 MB web and worker containers and a 512 MB PostgreSQL instance. Keep that split. Local verification does not prove the new agent fits or works on the hosted containers; publish and measure that release separately.

## Verification

```sh
TEST_URL=http://localhost:3001 npm run test:returns
TEST_URL=http://localhost:3001 npm run test:support
```

Support service tests use explicit model responses while exercising real PostgreSQL transactions and native commerce services. Run them against a local synthetic database with the background worker stopped. They create test orders and retain their evidence; they are not provider-accuracy tests.

Live-model trials and browser checks are recorded separately from those deterministic tests. Customer-initiated support, inspected refunds, full unshipped cancellation and proactive delivery investigations are implemented locally. Exchanges, image reasoning and external messaging remain later work. Hosted agent verification is still outstanding. The Health tab separates worker liveness, model results, queued work and verified outcomes. See the root README and DEMO.md for the current checks and demo sequence.
