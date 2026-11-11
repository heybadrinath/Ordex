# Seller Rescue demo

Ordex is the demo store. Seller Rescue is its support agent. Use synthetic accounts, payments and courier events throughout.

## Three-minute walkthrough

Prepare two browser sessions: Maya's customer account and the private seller account. Choose a freshly delivered demo order below the automatic refund limit and a second order above it. Do not rely on an old order still being inside the seven-day window. Keep the worker running.

| Time | Show | Point to make |
| --- | --- | --- |
| 0:00–0:20 | Customer order → Get help | A small seller needs the problem resolved, not another drafted reply. |
| 0:20–0:55 | Ask to return one damaged item; inspect and confirm the exact proposal | The agent identifies the item and amount. Customer consent is a separate, explicit action. |
| 0:55–1:25 | Seller receives and inspects the return; customer sees the verified demo refund | Real persisted operations on synthetic data. No refund before inspection; no automatic restock. |
| 1:25–1:55 | Above-limit refund → exact seller approval → handback | The backend enforces the cumulative limit. Approval and control of the conversation are separate. |
| 1:55–2:20 | Refresh both sessions; open the audit record | The case, action and receipt survive. Retrying the same operation does not pay twice. |
| 2:20–2:45 | Delivery watch with one saved courier exception | The worker investigates before a complaint and leaves an actionable seller brief. The courier is simulated. |
| 2:45–3:00 | Agent setup → Health and closing view | Show actual worker/model signals and completed actions, then state the limits of the demonstration. |

Rehearse without skipping waits in a way that implies instant processing. If provider access fails, show the saved state and seller takeover; do not imply a refund completed. Use the audit log to show the original operation and its receipt. A single successful decision is not proof of an end-to-end workflow.

## Six-slide story

1. **The seller's problem.** Repeated delivery, return and refund queries interrupt a small business. The task is completing support work across records and time.
2. **The customer and seller experience.** One saved conversation attached to an owned order. Customer confirmation, seller inspection, refund receipt and human takeover.
3. **How the agent works.** Read current evidence → choose a typed step → validate permissions and consent → execute native commerce services → verify → save or wait.
4. **Autonomy with boundaries.** Cumulative refund cap, exact approvals, no refunds before inspection, ownership checks, duplicate protection and emergency pause. Show one actual audit record.
5. **What makes the demo useful.** Proactive delivery investigation, durable follow-ups, reviewed store knowledge and explicit handback. Existing support products also offer actions; demonstrate the complete, inspectable resolution loop on a free, self-hosted stack.
6. **Evidence and next step.** Report measured local results separately from hosted results. Name platform reuse, the synthetic payment/courier boundary and remaining limits. Include accessible repository, demo and video links only after verification.

## Before recording or submitting

- Verify customer and seller login, ownership denial and private seller credentials on the deployed revision.
- Verify web, worker and database restart persistence, background continuation with customer tabs closed, model access and memory within the free plan.
- Complete the same return/refund journey online. Confirm one ledger entry and unchanged stock for a damaged return.
- Check links in a signed-out browser. Supply the README, a video no longer than three minutes and a six-slide deck.
- Preserve honest implementation dates and upstream licenses. Keep internal plans, credentials, database dumps and local test evidence out of the public repository.

No deployment, submission, payment or account change is performed by these instructions.
