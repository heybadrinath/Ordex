# Ordex · Seller Rescue

Ordex is a demo store for **AgentX PS-04: Autonomous support agent for online sellers**. Customers can ask about an order, check delivery, or start a return in the store. The agent looks up the relevant records and handles what it can under the seller’s rules. The seller can see what happened and step in when a decision needs them.

## Try the live demo

[Open the storefront](https://site--ordex-web--l244vqzv62g9.code.run/) and sign in with these shared demo accounts. Orders, payments, refunds, and courier events use synthetic data.

| Account | Email | Password | Sign in |
| --- | --- | --- | --- |
| Customer · Maya Shah | `maya@ordex.example` | `Explore123!` | [Customer sign-in](https://site--ordex-web--l244vqzv62g9.code.run/account/login) |
| Seller · Ordex Studio | `seller@ordex.example` | `DemoStore123!` | [Seller sign-in](https://site--ordex-web--l244vqzv62g9.code.run/admin/login) |

After signing in, open the walkthrough links below.

| What to try | What to look for |
| --- | --- |
| **1. Ask a customer question** · [Order DX-1042](https://site--ordex-web--l244vqzv62g9.code.run/account/support?case=ade1c5e8-f92c-45c1-8584-137b3dbbec83) | Ask “Are checkout payments and Demo courier tracking events simulated?” The agent can answer from the published FAQ and cite the passage. The saved conversation also shows a return-window answer based on the seller’s policy. |
| **2. Inspect a completed return** · [Order DX-1041](https://site--ordex-web--l244vqzv62g9.code.run/account/support?case=e681f5ca-47e8-45a2-8a03-9a5059192c34) | Follow the chipped-mug report through the agent’s exact return proposal, customer confirmation, seller receipt and inspection, and the verified ₹590 simulated refund. |
| **3. See when the seller steps in** · [Delivery case DX-1046](https://site--ordex-web--l244vqzv62g9.code.run/admin/support?case=d89bcca2-3caa-4e77-8004-c24b9d9cfef7) | The worker spotted a courier exception and raised it in the seller inbox. Open the seller brief to see the order evidence, what’s unresolved, and the decision the seller needs to make. The inbox also gives sellers approval, takeover, and audit controls. |
| **4. Inspect the agent’s rules** · [Agent Setup](https://site--ordex-web--l244vqzv62g9.code.run/admin/agent-setup) | Open **Knowledge** to see the published FAQ and **Permissions** to see return windows, refund limits, and approval rules. Use **Test a request** to preview how a request fits those rules. **Health** shows worker status and the last model result. |

For a closer look at the completed return, open the [seller audit log for DX-1041](https://site--ordex-web--l244vqzv62g9.code.run/admin/support?view=audit&case=e681f5ca-47e8-45a2-8a03-9a5059192c34). Compare the agent’s proposal with the refund receipt. The proposal shows what the agent intended to do, and the receipt shows what the store recorded after confirmation and inspection.

## How the agent works

The [Ordex technical guide for judges](https://whimsical-tank-5e9.notion.site/Ordex-How-the-agent-works-3fffa691b6ea816da19cc8b5130450a1) traces the live cases from customer request to verified store action. It covers the model contract, refund and approval rules, knowledge retrieval, worker recovery, and the code behind each step.

1. **Load the evidence.** The worker reads the signed-in customer’s order, items, payment, delivery, and return records from PostgreSQL. It uses full-text search to find relevant passages from published customer-safe guidance.
2. **Choose a next step.** Gemini 3.5 Flash-Lite reads the conversation and evidence and returns a structured decision. It can select an order-status answer, cite a published passage, ask for missing details, propose a return or cancellation, or hand the case to the seller. Straightforward return-policy questions can use the configured policy directly.
3. **Check the rules and act.** The server enforces order ownership, item quantities, the return window, refund limits, exact customer consent, inspection, and seller approval where required. Eligible actions run through the store’s commerce services. The server prevents duplicate actions and verifies the resulting order or payment record before reporting success.
4. **Save the outcome.** Conversations, approvals, model activity, and action receipts are saved for seller review. The worker also checks for delivery exceptions and follows up on saved work. If the model is unavailable, Ordex keeps the request for retry or seller review.

In **Agent Setup**, the model can also review draft store guidance and flag ambiguities. A seller reviews and publishes the source before it can be retrieved for a customer answer.

| Situation | What Ordex does |
| --- | --- |
| A return exceeds the seller’s refund limit | The case waits for the seller to approve the specific action and amount. |
| A customer confirms a return | The agent can create the return. A refund still waits for the seller to record receipt and inspection. |
| A seller takes over a conversation | Automated work pauses for that case until the seller explicitly hands it back. |
| A model request or worker run is interrupted | The case stays in PostgreSQL. The worker can resume saved work, with duplicate protection on commerce actions. |

## Where to read the code

Most of the hackathon code is in `extensions/ordex/src/`. Start with [`agent.ts`](extensions/ordex/src/services/support/agent.ts): `decide()` defines the model’s prompt and decision contract, and `tick()` is the worker entry point.

| Path | What’s there |
| --- | --- |
| [`extensions/ordex/src/services/support/`](extensions/ordex/src/services/support/) | Agent workflow in [`agent.ts`](extensions/ordex/src/services/support/agent.ts), order context and seller controls in [`cases.ts`](extensions/ordex/src/services/support/cases.ts), model calls and limits in [`model.ts`](extensions/ordex/src/services/support/model.ts), knowledge review and retrieval in [`knowledge.ts`](extensions/ordex/src/services/support/knowledge.ts), and proactive checks in [`delivery.ts`](extensions/ordex/src/services/support/delivery.ts). |
| [`extensions/ordex/src/services/`](extensions/ordex/src/services/) | Commerce actions and their safeguards in [`returns.ts`](extensions/ordex/src/services/returns.ts) and [`cancellations.ts`](extensions/ordex/src/services/cancellations.ts). |
| [`extensions/ordex/src/api/`](extensions/ordex/src/api/) | Customer and seller support endpoints used by the UI. |
| [`extensions/ordex/src/pages/`](extensions/ordex/src/pages/) and [`components/`](extensions/ordex/src/components/) | Customer support, seller inbox, and Agent Setup screens. |
| [`extensions/ordex/src/migration/`](extensions/ordex/src/migration/) | PostgreSQL schema for support cases, knowledge, audit records, and worker state. |
| [`tests/support.test.mjs`](tests/support.test.mjs) | Support integration scenarios covering decisions, policy checks, and saved outcomes. |
| [`packages/evershop/`](packages/evershop/) | EverShop 2.3.0 commerce foundation for accounts, catalog, orders, and inventory. Ordex adds the support agent as an extension. |

The hosted demo runs a web service and a background worker backed by the same PostgreSQL database.

EverShop is included under GPL-3.0. See [upstream notices](UPSTREAM.md), [license](LICENSE), and [asset credits](ASSET_CREDITS.md).
