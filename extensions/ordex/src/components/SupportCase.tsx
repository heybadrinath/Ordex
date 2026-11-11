import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@components/common/ui/Button.js';
import { Image } from '@components/common/Image.js';
import {
  Check,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  PanelRight,
  X
} from 'lucide-react';

export const money = (minor, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(
    Number(minor) / 100
  );
export const when = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
export const stateLabel = (c, admin = false) =>
  c.next_action === 'Local verification fixture completed.'
    ? 'Test fixture'
    : c.controller === 'seller'
    ? 'With seller'
    : c.lease_until && new Date(c.lease_until).getTime() > Date.now()
    ? 'Working'
    : {
        OPEN: 'Queued',
        WORKING: 'Working',
        AWAITING_CUSTOMER: admin ? 'Waiting for customer' : 'Your turn',
        AWAITING_SELLER: 'Needs review',
        WAITING_FOR_EVENT: c.next_action?.startsWith('Delivery:')
          ? 'Watching delivery'
          : 'Waiting for items',
        RESOLVED: 'Resolved'
      }[c.status] || c.status;

export function SupportCase({
  data,
  admin,
  busy,
  perform,
  drafts,
  loadEarlier,
  customerName = ''
}) {
  const [draft, setDraft] = useState(drafts[data.case.case_id]?.body || '');
  const [handback, setHandback] = useState(false);
  const [note, setNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const messages = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const evidence = useRef<HTMLElement>(null);
  const [earlierBusy, setEarlierBusy] = useState(false);
  const [earlierError, setEarlierError] = useState('');
  useEffect(() => {
    if (!showDetails) return;
    const previous = document.activeElement as HTMLElement;
    const drawer = evidence.current;
    const elements = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'button,a[href],summary,[tabindex="0"]'
        ) || []
      ).filter((el) => el.offsetParent !== null);
    elements()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowDetails(false);
      }
      if (event.key === 'Tab') {
        const items = elements(),
          first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [showDetails]);
  const c = data.case;
  useEffect(() => {
    if (following.current && messages.current) {
      messages.current.scrollTop = messages.current.scrollHeight;
    }
  }, [data.messages.length, data.actions.length, c.case_id]);
  useEffect(() => {
    setDraft(drafts[c.case_id]?.body || '');
    following.current = true;
    setHandback(false);
    setNote('');
    setShowDetails(false);
  }, [c.case_id]);
  useEffect(() => {
    if (handback && messages.current) messages.current.scrollTop = 0;
  }, [handback]);
  const pending = data.actions.filter(
    (a) => a.state === 'proposed' || (admin && a.state === 'awaiting_approval')
  );
  async function send(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const entry = drafts[c.case_id] || { body: draft, key: '' };
    if (!entry.key) entry.key = crypto.randomUUID();
    drafts[c.case_id] = entry;
    following.current = true;
    const okay = await perform({
      command: admin ? 'reply' : 'message',
      caseId: c.case_id,
      body: draft,
      clientKey: entry.key
    });
    if (okay) {
      delete drafts[c.case_id];
      setDraft('');
    }
  }
  return (
    <div className="support-detail" data-context={showDetails}>
      <section className="support-conversation" aria-label="Conversation">
        <header className="support-case-heading">
          <div className="support-case-identity">
            <div>
              <h2>Order #{data.order.order_number}</h2>
              <span className="support-case-reference">
                {admin && customerName && (
                  <>
                    <span>{customerName}</span> ·{' '}
                  </>
                )}
                Case {c.case_id.slice(0, 8)}
              </span>
            </div>
          </div>
          <div className="support-case-heading-actions">
            {admin && c.controller === 'seller' && (
              <Button
                variant="outline"
                disabled={!!busy}
                onClick={() => setHandback(!handback)}
              >
                Hand back to agent
              </Button>
            )}
            <button
              type="button"
              className="support-context-toggle"
              aria-label="Order details"
              aria-expanded={showDetails}
              onClick={() => setShowDetails(!showDetails)}
            >
              <PanelRight size={17} />
              <span>Order details</span>
            </button>
          </div>
        </header>
        <div
          className="support-next"
          role="status"
          data-working={stateLabel(c) === 'Working'}
        >
          <span
            className={`support-status ${
              c.status === 'RESOLVED' ? 'is-resolved' : ''
            }`}
            data-state={c.status}
            data-owner={c.controller}
          >
            {stateLabel(c, admin)}
          </span>
          <span>{c.next_action}</span>
        </div>
        {admin && c.controller === 'agent' && c.failures > 0 && (
          <p className="support-retry-note">
            A review could not finish. Retry checks the saved case again;
            completed returns and refunds are verified before proceeding.
          </p>
        )}
        <div
          className="support-conversation-body"
          ref={messages}
          onScroll={(e) => {
            const el = e.currentTarget;
            following.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 60;
          }}
        >
          {data.hasEarlier && (
            <div className="support-load-earlier">
              <Button
                variant="ghost"
                disabled={earlierBusy}
                onClick={async () => {
                  const height = messages.current?.scrollHeight || 0;
                  following.current = false;
                  setEarlierBusy(true);
                  setEarlierError('');
                  try {
                    await loadEarlier();
                    requestAnimationFrame(() => {
                      if (messages.current)
                        messages.current.scrollTop =
                          messages.current.scrollHeight - height;
                    });
                  } catch (e) {
                    setEarlierError(e.message);
                  } finally {
                    setEarlierBusy(false);
                  }
                }}
              >
                {earlierBusy ? 'Loading…' : 'Load earlier messages'}
              </Button>
              {earlierError && <p role="alert">{earlierError}</p>}
            </div>
          )}
          {admin && data.brief && (
            <details
              className="support-handoff-brief"
              open={c.status === 'AWAITING_SELLER' || c.controller === 'seller'}
            >
              <summary>Seller brief · verified context</summary>
              <dl>
                <dt>Customer request</dt>
                <dd>{data.brief.request}</dd>
                <dt>Verified facts</dt>
                <dd>{data.brief.facts}</dd>
                <dt>Completed</dt>
                <dd>
                  {data.brief.completed.join(' ') ||
                    'No commerce action completed.'}
                </dd>
                <dt>Waiting on</dt>
                <dd>{data.brief.blocked}</dd>
                <dt>Decision needed</dt>
                <dd>{data.brief.decision}</dd>
              </dl>
            </details>
          )}
          {handback && (
            <form
              className="support-handback"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await perform({
                    command: 'handback',
                    caseId: c.case_id,
                    body: note
                  })
                )
                  setHandback(false);
              }}
            >
              <h3>Continue from here</h3>
              <p>
                The agent will reload current order, consent and approval
                records. This note does not grant a refund approval. Only the
                seller and agent see it.
              </p>
              <label>
                What changed, and what should happen next?
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  required
                  placeholder="I have spoken to the customer. Continue with the inspected return…"
                />
              </label>
              <Button
                type="submit"
                disabled={!!busy}
                isLoading={busy === 'handback'}
                loadingText="Handing back"
              >
                Confirm handback
              </Button>
              <Button
                variant="ghost"
                disabled={!!busy}
                onClick={() => setHandback(false)}
              >
                Cancel
              </Button>
            </form>
          )}
          <div
            className="support-messages"
            aria-label="Case conversation"
            role="log"
            aria-live="polite"
          >
            {data.messages.map((m, index) => (
              <React.Fragment key={m.message_id}>
                {(index === 0 ||
                  new Date(m.created_at).toDateString() !==
                    new Date(
                      data.messages[index - 1].created_at
                    ).toDateString()) && (
                  <div className="support-day">
                    <span>
                      {new Date(m.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <article
                  className={`support-message from-${m.actor}`}
                  data-internal={
                    !!(m.metadata?.internal || m.metadata?.handback)
                  }
                >
                  <div className="support-message-meta">
                    <strong>
                      {m.actor === 'customer'
                        ? admin
                          ? 'Customer'
                          : 'You'
                        : m.actor === 'seller'
                        ? m.metadata?.handback
                          ? 'Seller note · internal'
                          : 'Seller'
                        : m.actor === 'system'
                        ? 'Case update'
                        : 'Ordex support'}
                    </strong>
                    <time dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  <p>{m.body}</p>
                  {m.metadata?.sources?.length > 0 && (
                    <div className="support-sources">
                      {m.metadata.sources.map((s) => (
                        <span key={s.chunkId}>
                          <ShieldCheck size={12} />
                          {s.title} · v{s.revision} · {s.location}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.metadata?.receipt && (
                    <div className="support-receipt">
                      <Check size={18} />
                      <div>
                        <strong>
                          {money(
                            m.metadata.receipt.amountMinor,
                            m.metadata.receipt.currency
                          )}{' '}
                          · refund verified
                        </strong>
                        <small>
                          {m.metadata.receipt.reference ||
                            'No remaining payment to reverse'}
                        </small>
                      </div>
                    </div>
                  )}
                </article>
              </React.Fragment>
            ))}
          </div>
          {pending.map((a) => (
            <section className="support-action-card" key={a.action_id}>
              <div>
                <span className="support-eyebrow">
                  {a.state === 'awaiting_approval'
                    ? 'SELLER DECISION'
                    : 'EXACT CONFIRMATION'}
                </span>
                <h3>
                  {a.kind === 'return'
                    ? 'Return these items'
                    : a.kind === 'cancel'
                    ? 'Cancel this entire order'
                    : a.kind === 'authorize'
                    ? 'Authorize the return'
                    : 'Confirm the item refund'}
                </h3>
              </div>
              {a.payload.items?.map((i) => (
                <div className="support-action-line" key={i.id}>
                  <span>
                    {i.name} × {i.qty}
                  </span>
                  <strong>{money(i.amountMinor, a.payload.currency)}</strong>
                </div>
              ))}
              {a.payload.reason && <p>Reason: {a.payload.reason}</p>}
              {a.payload.refundMinor != null && (
                <div className="support-action-total">
                  <span>
                    {a.kind === 'cancel'
                      ? 'Payment reversal · includes delivery'
                      : 'Item refund · delivery excluded'}
                  </span>
                  <strong>
                    {money(a.payload.refundMinor, a.payload.currency)}
                  </strong>
                </div>
              )}
              {admin && (
                <small>
                  Policy v{a.policy_id} · {a.payload_hash.slice(0, 12)}
                  {a.approval
                    ? ` · Approval ${
                        new Date(a.approval.expires_at).getTime() < Date.now()
                          ? 'expired'
                          : 'expires'
                      } ${when(a.approval.expires_at)}`
                    : ''}
                </small>
              )}
              {!admin && a.state === 'proposed' && (
                <>
                  <p>
                    {a.kind === 'cancel'
                      ? 'Confirming cancels all these items and reverses the remaining demo payment. The order must still be unshipped; seller approval may be required.'
                      : 'Confirming also permits this exact item refund after physical receipt, seller inspection and any required approval.'}
                  </p>
                  <Button
                    disabled={!!busy}
                    isLoading={busy === 'confirm'}
                    loadingText="Confirming"
                    onClick={() =>
                      perform({
                        command: 'confirm',
                        caseId: c.case_id,
                        actionId: a.action_id,
                        hash: a.payload_hash
                      })
                    }
                  >
                    Confirm{' '}
                    {a.kind === 'return'
                      ? 'return & conditional refund'
                      : a.kind === 'cancel'
                      ? 'cancellation & payment reversal'
                      : 'item refund'}
                  </Button>
                </>
              )}
              {admin && a.state === 'awaiting_approval' && (
                <>
                  {a.review?.checks?.withinLimit === false && (
                    <p className="support-approval-reason">
                      {money(a.payload.refundMinor, a.payload.currency)}{' '}
                      requested +{' '}
                      {money(a.review.committedMinor, a.payload.currency)}{' '}
                      already refunded or committed exceeds the{' '}
                      {money(a.review.limitMinor, a.payload.currency)} automatic
                      limit per order.
                    </p>
                  )}
                  <p>
                    Approval is valid for 15 minutes. Current policy and order
                    checks still apply.
                  </p>
                  <div className="support-action-buttons">
                    <Button
                      disabled={!!busy}
                      isLoading={busy === 'approve'}
                      onClick={() =>
                        perform({
                          command: 'approve',
                          caseId: c.case_id,
                          actionId: a.action_id,
                          hash: a.payload_hash
                        })
                      }
                    >
                      Approve exact action
                    </Button>
                    {c.controller === 'seller' && (
                      <Button
                        variant="outline"
                        disabled={!!busy}
                        onClick={() =>
                          perform({
                            command: 'approve',
                            caseId: c.case_id,
                            actionId: a.action_id,
                            hash: a.payload_hash,
                            handback: true
                          })
                        }
                      >
                        Approve and hand back
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() =>
                        perform({
                          command: 'reject',
                          caseId: c.case_id,
                          actionId: a.action_id,
                          hash: a.payload_hash
                        })
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </>
              )}
            </section>
          ))}
        </div>
        {!admin || c.controller === 'seller' ? (
          <form className="support-composer" onSubmit={send}>
            <label htmlFor="support-message">
              {admin
                ? 'Reply as the seller'
                : c.status === 'RESOLVED'
                ? 'Ask for more help'
                : 'Message support'}
            </label>
            <div>
              <textarea
                id="support-message"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  drafts[c.case_id] = { body: e.target.value, key: '' };
                }}
                maxLength={2000}
                rows={2}
                placeholder={
                  admin
                    ? 'Your message to the customer…'
                    : 'Tell us what happened…'
                }
                required
                disabled={!!busy}
              />
              <Button
                type="submit"
                disabled={!!busy || !draft.trim()}
                isLoading={busy === 'message' || busy === 'reply'}
                loadingText="Sending"
              >
                Send
              </Button>
            </div>
            {!admin && (
              <div className="support-composer-foot">
                <small>Your conversation is saved to this order.</small>
                <button
                  type="button"
                  disabled={!!busy || c.controller === 'seller'}
                  onClick={() =>
                    perform({ command: 'person', caseId: c.case_id })
                  }
                >
                  <MessageSquare size={14} /> Ask for a person
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="support-composer-note">
            <div>
              <strong>Agent is handling replies</strong>
              <p>Take over whenever you want to speak to the customer.</p>
            </div>
            <div className="support-owner-actions">
              {c.failures > 0 && (
                <Button
                  variant="outline"
                  disabled={!!busy}
                  isLoading={busy === 'retry'}
                  title="Rechecks the saved case after a failed review. Completed actions are reconciled before any retry."
                  onClick={() =>
                    perform({ command: 'retry', caseId: c.case_id })
                  }
                >
                  Retry agent review
                </Button>
              )}
              <Button
                variant="outline"
                disabled={!!busy}
                isLoading={busy === 'takeover'}
                onClick={() =>
                  perform({ command: 'takeover', caseId: c.case_id })
                }
              >
                Take over
              </Button>
            </div>
          </div>
        )}
      </section>
      <aside
        className="support-evidence"
        ref={evidence}
        role={showDetails ? 'dialog' : undefined}
        aria-modal={showDetails || undefined}
        aria-label="Order and case details"
      >
        <header>
          <div>
            <h2>Case details</h2>
            <span>Order #{data.order.order_number}</span>
          </div>
          <button
            type="button"
            className="support-context-close"
            aria-label="Close case details"
            onClick={() => setShowDetails(false)}
          >
            <X size={17} />
          </button>
        </header>
        <section>
          <h3>Order</h3>
          <span className="support-status">
            {{
              pending: 'Preparing order',
              shipped: 'On the way',
              delivered: 'Delivered',
              canceled: 'Canceled'
            }[data.order.shipment_status] ||
              data.order.shipment_status.replaceAll('_', ' ')}
          </span>
          {data.delivery?.watch &&
            !data.delivery.canceled &&
            !data.delivery.delivered && (
              <p className="support-delivery-target">
                Delivery target: {when(data.delivery.watch.expected_at)} IST ·
                estimated
              </p>
            )}
          {data.delivery?.latest && (
            <p>
              {data.delivery.latest.kind.replaceAll('_', ' ')} ·{' '}
              {when(data.delivery.latest.occurred_at)}
              <br />
              {data.delivery.latest.note}
            </p>
          )}
          {data.order.items.map((i) => (
            <div className="support-product" key={i.id}>
              <Image
                src={i.thumbnail}
                alt=""
                width={48}
                height={48}
                unoptimized
              />
              <div>
                <strong>{i.name}</strong>
                <small>
                  Qty {i.qty} · {i.sku}
                </small>
              </div>
            </div>
          ))}
          <a
            href={
              admin
                ? `/admin/order/edit/${data.order.uuid}`
                : `/account/orders/${data.order.uuid}`
            }
          >
            View order <ArrowUpRight size={14} />
          </a>
        </section>
        <section>
          <h3>
            {data.returns.length > 1
              ? `Returns (${data.returns.length})`
              : 'Return status'}
          </h3>
          {data.returns.length ? (
            data.returns.map((r) => (
              <div className="support-return-evidence" key={r.return_id}>
                <div className="support-return-heading">
                  <strong>Return #{r.return_id.slice(0, 8)}</strong>
                  <span
                    className={`support-status ${
                      r.status === 'refunded' ? 'is-resolved' : ''
                    }`}
                  >
                    {r.status.replaceAll('_', ' ')}
                  </span>
                </div>
                {r.items?.map((item) => (
                  <p className="support-return-item" key={item.id}>
                    {item.qty} × {item.name}
                  </p>
                ))}
                <small>
                  {r.reason} · {money(r.refund_minor, data.order.currency)}
                </small>
                <div className="support-steps">
                  {['approved', 'received', 'inspected', 'refunded'].map(
                    (s, index) => (
                      <span
                        key={s}
                        className={
                          [
                            'requested',
                            'approved',
                            'received',
                            'inspected',
                            'refunded'
                          ].indexOf(r.status) > index
                            ? 'done'
                            : ''
                        }
                      >
                        <Check size={12} />
                        {s}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No return requested yet.</p>
          )}
          <a
            href={
              admin
                ? `/admin/returns?order=${data.order.order_number}`
                : `/account/returns?order=${data.order.uuid}`
            }
          >
            {admin ? 'Record receipt or inspection' : 'Returns & refunds'}{' '}
            <ArrowUpRight size={14} />
          </a>
        </section>
        <section className="support-case-activity">
          <details>
            <summary>
              Case activity <span>{data.timeline.length} updates</span>
            </summary>
            <ol className="support-timeline">
              {data.timeline.map((e) => (
                <li key={e.audit_id}>
                  <span />
                  <div>
                    <p>{e.summary}</p>
                    <time>{when(e.created_at)}</time>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </section>
      </aside>
    </div>
  );
}
