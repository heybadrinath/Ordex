import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccountNav } from '@components/frontStore/customer/AccountNav.js';
import { Button } from '@components/common/ui/Button.js';
import { LoadingState } from '@components/common/LoadingState.js';
import {
  Headphones,
  ShieldCheck,
  Search,
  X,
  RefreshCw,
  ArrowLeft,
  ArrowUpRight,
  Inbox
} from 'lucide-react';
import { SupportCase, stateLabel, when } from './SupportCase.js';
import AgentSetup from './AgentSetup.js';
import DeliveryMonitor from './DeliveryMonitor.js';
import AuditRows from './AuditLog.js';
import { describeAuditEvent, isMainAuditEvent } from './auditPresentation.js';

export async function api(url, body?) {
  let response;
  try {
    response = await fetch(
      url,
      body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }
        : { cache: 'no-store' }
    );
  } catch {
    throw new Error(
      'Connection lost. Your draft is kept here. Reconnect and retry.'
    );
  }
  const result = await response.json().catch(() => {
    throw new Error('The server could not finish this request. Please retry.');
  });
  if (!response.ok || result.error)
    throw new Error(result.error?.message || 'This request could not finish.');
  return result.data;
}
export default function SupportWorkspace({ admin = false, setup = false }) {
  const [data, setData] = useState<any>(null),
    [detail, setDetail] = useState<any>(null),
    [selected, setSelected] = useState('');
  const [view, setView] = useState(setup ? 'setup' : 'inbox'),
    [filter, setFilter] = useState('open'),
    [query, setQuery] = useState('');
  const [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [syncError, setSyncError] = useState(''),
    [audit, setAudit] = useState<any[]>([]),
    [auditBusy, setAuditBusy] = useState(''),
    [auditMore, setAuditMore] = useState(false),
    [auditFilter, setAuditFilter] = useState('activity'),
    [auditSearch, setAuditSearch] = useState(''),
    [auditShowTests, setAuditShowTests] = useState(false),
    [orders, setOrders] = useState<any[]>([]),
    [orderQuery, setOrderQuery] = useState('');
  const working = useRef(false),
    current = useRef(''),
    auditRequest = useRef(0),
    drafts = useRef<Record<string, { body: string; key: string }>>({});
  const initialSelection = useRef(false);
  const base = admin ? '/api/support/admin' : '/api/support/customer';
  const load = useCallback(async () => {
    const result = await api(base);
    setData(result);
    const id = current.current;
    if (id) {
      const found = await api(`${base}?caseId=${id}`);
      if (current.current === id)
        setDetail((previous) =>
          previous?.case.case_id === id
            ? {
                ...found,
                messages: [
                  ...previous.messages.filter(
                    (m) =>
                      Number(m.message_seq) <
                      Number(found.messages[0]?.message_seq || 0)
                  ),
                  ...found.messages
                ],
                hasEarlier:
                  previous.messages.length > found.messages.length
                    ? previous.hasEarlier
                    : found.hasEarlier
              }
            : found
        );
    }
    setSyncError('');
  }, [base]);
  useEffect(() => {
    let live = true;
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('case') || '';
    const initialView = params.get('view');
    if (
      admin &&
      ['audit', 'approvals', 'delivery'].includes(initialView || '')
    ) {
      setView(initialView!);
      setFilter(initialView === 'approvals' ? 'approvals' : 'all');
    } else if (initial) setFilter('all');
    current.current = initial;
    setSelected(initial);
    (async () => {
      if (!admin) {
        const result = await api('/api/returns/customer');
        if (live) setOrders(result.orders);
        if (params.get('order')) {
          const opened = await api(base, {
            command: 'open',
            orderId: params.get('order')
          });
          current.current = opened.caseId;
          setSelected(opened.caseId);
        }
      }
      await load();
    })().catch((e) => setSyncError(e.message));
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !working.current)
        load().catch((e) => setSyncError(e.message));
    }, 5000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load, admin, base]);
  async function loadAudit(earlier = false) {
    const request = ++auditRequest.current;
    setAuditBusy(earlier ? 'earlier' : 'refresh');
    try {
      const rows = await api(
        `/api/support/admin?view=audit${selected ? `&caseId=${selected}` : ''}${
          auditShowTests ? '&includeTests=true' : ''
        }${earlier && audit.length ? `&before=${audit.at(-1).audit_id}` : ''}`
      );
      if (request !== auditRequest.current) return;
      setAudit((current) => (earlier ? [...current, ...rows] : rows));
      setAuditMore(rows.length === 100);
      setError('');
    } catch (e) {
      if (request === auditRequest.current) setError(e.message);
    } finally {
      if (request === auditRequest.current) setAuditBusy('');
    }
  }
  useEffect(() => {
    if (view === 'audit') {
      setAudit([]);
      loadAudit();
    }
    return () => {
      auditRequest.current += 1;
    };
  }, [view, selected, auditShowTests]);
  useEffect(() => {
    if (detail?.case.status === 'RESOLVED' && filter === 'open')
      setFilter('all');
  }, [detail?.case.status]);
  function updateLocation(id = selected, nextView = view) {
    const params = new URLSearchParams();
    if (id) params.set('case', id);
    if (admin && ['audit', 'approvals', 'delivery'].includes(nextView))
      params.set('view', nextView);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${params.size ? `?${params}` : ''}`
    );
  }
  function clearSelection() {
    current.current = '';
    setSelected('');
    setDetail(null);
    updateLocation('');
  }
  async function choose(id) {
    current.current = id;
    setSelected(id);
    setDetail(null);
    updateLocation(id);
    try {
      const found = await api(`${base}?caseId=${id}`);
      if (current.current === id)
        setDetail((previous) =>
          previous?.case.case_id === id
            ? {
                ...found,
                messages: [
                  ...previous.messages.filter(
                    (m) =>
                      Number(m.message_seq) <
                      Number(found.messages[0]?.message_seq || 0)
                  ),
                  ...found.messages
                ],
                hasEarlier:
                  previous.messages.length > found.messages.length
                    ? previous.hasEarlier
                    : found.hasEarlier
              }
            : found
        );
    } catch (e) {
      setError(e.message);
    }
  }
  async function perform(body) {
    if (working.current) return false;
    working.current = true;
    setBusy(body.command);
    setError('');
    try {
      const result = await api(base, body);
      if (body.command === 'open') {
        await choose(result.caseId);
      }
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      working.current = false;
      setBusy('');
    }
  }
  const cases = (admin ? data?.cases : data) || [];
  const workerOnline =
    !!data?.heartbeat &&
    Date.now() - new Date(data.heartbeat).getTime() < 90000;
  const matchesFilter = (c, value) =>
    (value === 'tests'
      ? c.next_action === 'Local verification fixture completed.'
      : c.next_action !== 'Local verification fixture completed.') &&
    (value !== 'approvals' || c.approvals > 0) &&
    (value !== 'seller' || c.controller === 'seller') &&
    (value !== 'open' || c.status !== 'RESOLVED');
  function changeFilter(value) {
    setFilter(value);
    if (
      detail &&
      !matchesFilter(
        cases.find((c) => c.case_id === selected) || detail.case,
        value
      )
    )
      clearSelection();
  }
  const shown = cases.filter(
    (c) =>
      matchesFilter(c, filter) &&
      `${c.order_number} ${c.customer_full_name || ''} ${c.last_message || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  useEffect(() => {
    if (
      !admin ||
      !data ||
      initialSelection.current ||
      !['inbox', 'approvals'].includes(view)
    )
      return;
    initialSelection.current = true;
    if (selected) {
      if (
        view !== 'approvals' ||
        cases.some((c) => c.case_id === selected && matchesFilter(c, filter))
      )
        return;
      clearSelection();
    }
    const first = cases.find((c) => matchesFilter(c, filter));
    if (first) choose(first.case_id);
  }, [data, admin, view, selected, filter]);
  const caseList = (
    <section className="support-list">
      <header className="support-list-heading">
        <h2>
          {admin
            ? view === 'approvals'
              ? 'Pending approvals'
              : 'Conversations'
            : 'Your conversations'}{' '}
          <span>{shown.length}</span>
        </h2>
        {admin && view !== 'approvals' && (
          <select
            aria-label="Filter cases"
            value={filter}
            onChange={(e) => changeFilter(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="all">All cases</option>
            <option value="seller">With seller</option>
            <option value="approvals">Needs approval</option>
            {cases.some(
              (c) => c.next_action === 'Local verification fixture completed.'
            ) && <option value="tests">Test cases</option>}
          </select>
        )}
      </header>
      <div className="support-list-tools">
        <div className="support-search">
          <Search size={16} />
          <input
            aria-label="Search support cases"
            placeholder="Search conversations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="support-search-clear"
              aria-label="Clear case search"
              onClick={() => setQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {!admin && (
          <div className="support-filters">
            {[
              ['open', 'Open'],
              ['all', 'All cases']
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => changeFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="support-case-list">
        {shown.map((c) => (
          <button
            className={`support-case-row ${
              selected === c.case_id ? 'selected' : ''
            }`}
            key={c.case_id}
            aria-pressed={selected === c.case_id}
            disabled={!!busy}
            onClick={() => choose(c.case_id)}
          >
            <div className="support-case-row-title">
              <strong>Order #{c.order_number}</strong>
              {!admin && (
                <span
                  className={`support-status ${
                    c.status === 'RESOLVED' ? 'is-resolved' : ''
                  }`}
                >
                  {stateLabel(c, admin)}
                </span>
              )}
            </div>
            {admin && (
              <span className="support-case-customer">
                {c.customer_full_name || 'Customer'}
              </span>
            )}
            <p>{c.last_message || c.next_action}</p>
            <div className="support-case-row-foot">
              {admin && (
                <span
                  className={`support-status ${
                    c.status === 'RESOLVED' ? 'is-resolved' : ''
                  }`}
                  data-state={c.approvals > 0 ? 'AWAITING_SELLER' : c.status}
                  data-owner={c.controller}
                >
                  {c.approvals > 0 ? 'Approval needed' : stateLabel(c, true)}
                </span>
              )}
              <time>{when(c.updated_at)}</time>
              {!admin &&
                (c.approvals > 0 ? (
                  <span className="support-needs">Approval needed</span>
                ) : (
                  <ArrowUpRight size={14} />
                ))}
            </div>
          </button>
        ))}
        {!shown.length && (
          <div className="support-empty">
            <Inbox size={26} />
            <h3>
              {query
                ? 'No matching conversations'
                : filter === 'approvals'
                ? 'No approvals waiting'
                : 'No open conversations'}
            </h3>
            <p>
              {query
                ? 'Try an order number or a different word.'
                : admin
                ? 'Customer requests will appear here.'
                : 'Choose an order above whenever you need help.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
  const conversation = detail ? (
    <SupportCase
      data={detail}
      loadEarlier={async () => {
        const id = current.current;
        const older = await api(
          `${base}?caseId=${id}&before=${detail.messages[0].message_seq}`
        );
        if (current.current === id)
          setDetail((previous) => ({
            ...previous,
            messages: [...older.messages, ...previous.messages],
            hasEarlier: older.hasEarlier
          }));
      }}
      admin={admin}
      customerName={
        cases.find((c) => c.case_id === selected)?.customer_full_name
      }
      busy={busy}
      perform={perform}
      drafts={drafts.current}
    />
  ) : selected ? (
    <LoadingState label="Opening conversation" />
  ) : (
    <div className="support-welcome">
      <Inbox size={32} strokeWidth={1.5} />
      <h2>Select a conversation</h2>
      <p>
        Review the order, reply to the customer and manage the next step here.
      </p>
    </div>
  );
  return (
    <div
      className={`support-workspace ${
        admin ? 'support-admin' : 'support-customer account-page'
      }`}
      data-view={view}
      data-selected={!!selected}
    >
      {!admin && <AccountNav active="support" />}
      <div className="support-page-content">
        <header className="support-heading">
          {!admin && (
            <span className="account-heading-icon" aria-hidden="true">
              <Headphones size={24} />
            </span>
          )}
          <div className="support-heading-copy">
            <h1>
              {view === 'setup'
                ? 'Agent setup'
                : view === 'audit'
                ? 'Audit log'
                : view === 'approvals'
                ? 'Approvals'
                : view === 'delivery'
                ? 'Delivery watch'
                : admin
                ? 'Support inbox'
                : 'Support'}
            </h1>
            <p>
              {view === 'setup'
                ? 'Knowledge, permissions and checks for your support agent.'
                : view === 'audit'
                ? 'See what the agent checked, decided and changed.'
                : view === 'approvals'
                ? 'Review requests that need your approval before the agent can continue.'
                : view === 'delivery'
                ? 'Investigate delays and keep customers informed.'
                : admin
                ? 'Manage customer conversations and the next step.'
                : 'Your conversations, returns and order updates.'}
            </p>
          </div>
          {admin && data && (
            <div className="support-header-actions">
              <div className="support-health">
                <span className="support-health-state">
                  <i
                    className={`support-dot ${
                      data.policy.paused
                        ? 'paused'
                        : !data.health?.modelConfigured
                        ? 'offline'
                        : workerOnline
                        ? ''
                        : 'offline'
                    }`}
                  />
                  {data.policy.paused
                    ? 'Agent paused'
                    : !data.health?.modelConfigured
                    ? 'Model not configured'
                    : workerOnline
                    ? 'Worker online'
                    : 'Worker offline'}
                </span>
                <span
                  title={`${(
                    Number(data.usage.input_tokens) + Number(data.usage.output_tokens)
                  ).toLocaleString()} tokens used today · Policy v${
                    data.policy.policy_id
                  }`}
                >
                  {data.usage.requests}/{data.limits.daily} calls today
                </span>
                <a href="/admin/agent-setup?tab=health">View health</a>
              </div>
              <Button
                variant="outline"
                isLoading={busy === 'stop'}
                disabled={!!busy}
                onClick={() =>
                  perform({ command: 'stop', paused: !data.policy.paused })
                }
              >
                {data.policy.paused ? 'Resume agent' : 'Pause agent'}
              </Button>
            </div>
          )}
          {!admin && selected && (
            <Button variant="outline" onClick={clearSelection}>
              <ArrowLeft size={15} /> All conversations
            </Button>
          )}
        </header>
        {(error || syncError) && (
          <div className="support-error" role="alert">
            <span>{error || syncError}</span>
            <Button
              variant="outline"
              onClick={() =>
                load()
                  .then(() => setError(''))
                  .catch((e) => setError(e.message))
              }
            >
              Retry
            </Button>
          </div>
        )}
        {admin && (
          <div className="support-toolbar">
            <nav className="support-tabs" aria-label="Support views">
              {[
                ['inbox', 'Inbox'],
                ['approvals', 'Approvals'],
                ['delivery', 'Delivery watch'],
                ['audit', 'Audit log'],
                ['setup', 'Agent setup']
              ].map(([id, label]: any) => (
                <button
                  key={id}
                  aria-current={view === id ? 'page' : undefined}
                  onClick={() => {
                    if ((id === 'setup') !== setup) {
                      window.location.assign(
                        id === 'setup'
                          ? '/admin/agent-setup'
                          : `/admin/support${
                              id !== 'inbox' ? `?view=${id}` : ''
                            }`
                      );
                      return;
                    }
                    setView(id);
                    setFilter(id === 'approvals' ? 'approvals' : 'all');
                    const keep =
                      id !== 'approvals' ||
                      cases.find((c) => c.case_id === selected)?.approvals;
                    if (!keep) clearSelection();
                    updateLocation(keep ? selected : '', id);
                  }}
                >
                  {label}
                  {id === 'approvals' && (
                    <span>{cases.reduce((n, c) => n + c.approvals, 0)}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
        {!data ? (
          <LoadingState label="Loading support" />
        ) : view === 'setup' ? (
          <AgentSetup overview={data} reload={load} />
        ) : view === 'delivery' ? (
          <DeliveryMonitor />
        ) : view === 'audit' ? (
          <section className="support-audit">
            {!selected && (
              <label className="audit-test-filter">
                <input
                  type="checkbox"
                  checked={auditShowTests}
                  onChange={(e) => setAuditShowTests(e.target.checked)}
                />{' '}
                Include local test activity
              </label>
            )}
            <div className="support-audit-toolbar">
              <div>
                <h2>
                  {selected
                    ? `Order #${
                        cases.find((c) => c.case_id === selected)
                          ?.order_number || selected.slice(0, 8)
                      }`
                    : 'Store activity'}
                </h2>
                <p>{audit.length} events loaded · newest first</p>
              </div>
              <label className="audit-search">
                <Search size={16} />
                <input
                  aria-label="Search loaded activity"
                  placeholder="Search loaded activity"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">Filter activity</span>
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                >
                  <option value="activity">Case activity</option>
                  <option value="all">All events</option>
                  <option value="actions">Actions & decisions</option>
                  <option value="model">Model usage</option>
                  <option value="control">Seller controls</option>
                  <option value="messages">Messages</option>
                  <option value="runs">Worker runs</option>
                </select>
              </label>
              <Button
                variant="outline"
                disabled={!!auditBusy}
                isLoading={auditBusy === 'refresh'}
                onClick={() => loadAudit()}
              >
                <RefreshCw size={14} /> Refresh
              </Button>
              {selected && (
                <Button variant="ghost" onClick={clearSelection}>
                  All cases
                </Button>
              )}
            </div>
            {auditBusy && !audit.length ? (
              <LoadingState label="Loading activity" />
            ) : (
              <AuditRows
                rows={audit.filter(
                  (e) =>
                    (auditFilter === 'all' ||
                      (auditFilter === 'activity'
                        ? isMainAuditEvent(e)
                        : eventGroup(e.event) === auditFilter)) &&
                    (!auditSearch.trim() ||
                      `${e.order_number || ''} ${e.customer_full_name || ''} ${
                        describeAuditEvent(e).title
                      } ${JSON.stringify(e.data)} ${e.message?.body || ''}`
                        .toLowerCase()
                        .includes(auditSearch.trim().toLowerCase()))
                )}
              />
            )}
            {auditMore && (
              <div className="support-audit-footer">
                <Button
                  variant="outline"
                  disabled={!!auditBusy}
                  isLoading={auditBusy === 'earlier'}
                  onClick={() => loadAudit(true)}
                >
                  Load earlier activity
                </Button>
              </div>
            )}
          </section>
        ) : admin &&
          view === 'approvals' &&
          !selected &&
          !cases.some((c) => matchesFilter(c, 'approvals')) ? (
          <section className="support-empty-panel">
            <ShieldCheck size={28} strokeWidth={1.5} />
            <h2>No approvals waiting</h2>
            <p>Requests that need your review will appear here.</p>
          </section>
        ) : admin ? (
          <div className="support-inbox-layout" data-selected={!!selected}>
            {caseList}
            <div className="support-case-panel">
              <button className="support-back" onClick={clearSelection}>
                <ArrowLeft size={15} /> Conversations
              </button>
              {conversation}
            </div>
          </div>
        ) : selected ? (
          <div className="support-customer-case">{conversation}</div>
        ) : (
          <div className="support-customer-index">
            <section className="support-start">
              <div>
                <h2>Start with an order</h2>
                <p>
                  Ask about delivery, request a return or get help from the
                  seller.
                </p>
              </div>
              <div className="support-order-picker">
                <label htmlFor="support-order-search">Find your order</label>
                <input
                  id="support-order-search"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="Order number or product name"
                />
                <div className="support-order-options">
                  {orders
                    .filter((o) =>
                      `${o.order_number} ${o.items
                        ?.map((i) => i.name)
                        .join(' ')}`
                        .toLowerCase()
                        .includes(orderQuery.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((o) => (
                      <button
                        disabled={!!busy}
                        key={o.uuid}
                        onClick={() =>
                          perform({ command: 'open', orderId: o.uuid })
                        }
                      >
                        <span>
                          <strong>#{o.order_number}</strong> ·{' '}
                          {o.items?.[0]?.name}
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))}
                  {!orders.length && (
                    <p>Your orders will appear here after checkout.</p>
                  )}
                </div>
              </div>
            </section>
            {caseList}
          </div>
        )}
      </div>
    </div>
  );
}

function eventGroup(event) {
  if (event.startsWith('model.')) return 'model';
  if (/^(control|policy|knowledge)\./.test(event)) return 'control';
  if (/^(message|reply)\./.test(event)) return 'messages';
  if (event.startsWith('run.')) return 'runs';
  return 'actions';
}
export { AuditRows };
