import { Image } from '@components/common/Image.js';
import React, { useEffect, useRef, useState } from 'react';
import { AccountNav } from '@components/frontStore/customer/AccountNav.js';
import { LoadingState } from '@components/common/LoadingState.js';
import { Button } from '@components/common/ui/Button.js';
const ReturnInsights = React.lazy(() =>
  import('./ReturnInsights.js').then((module) => ({
    default: module.ReturnInsights
  }))
);
import {
  ArrowUpRight,
  Check,
  Package,
  PackageOpen,
  RotateCcw,
  Truck,
  Search,
  ClipboardCheck,
  X
} from 'lucide-react';

const labels = {
  requested: 'Requested',
  approved: 'Ready to send',
  received: 'Received',
  inspected: 'Inspected',
  refunded: 'Refunded',
  rejected: 'Declined'
};
const reasons = [
  'Arrived damaged',
  'Not as expected',
  'Wrong item',
  'Changed my mind',
  'Other'
];
const money = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount));
const date = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

async function request(url, body?) {
  const response = await fetch(
    url,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      : {}
  );
  const json = await response.json();
  if (!response.ok || json.error)
    throw new Error(json.error?.message || 'Could not load this page.');
  return json.data;
}

export default function ReturnWorkspace({ admin = false }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const busy = Boolean(pendingAction);
  const [selected, setSelected] = useState('');
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState(admin ? 'open' : 'all');
  const [keyword, setKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [orderId, setOrderId] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState(reasons[1]);
  const [note, setNote] = useState('');
  const [condition, setCondition] = useState('resellable');
  const [inspection, setInspection] = useState(
    'Demo inspection completed for the selected condition.'
  );
  const [requestKey, setRequestKey] = useState('');
  const [success, setSuccess] = useState('');
  const listRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const url = `/api/returns/${admin ? 'admin' : 'customer'}`;
  async function load() {
    try {
      setData(await request(url));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    if (admin) {
      const orderReference = new URLSearchParams(window.location.search).get(
        'order'
      );
      if (orderReference) {
        setKeyword(orderReference);
        setFilter('all');
      }
    }
  }, []);
  const returns = (admin ? data : data?.returns) || [];
  const current = returns.find((r) => r.return_id === selected);
  const matchesFilter = (r) =>
    filter === 'all' ||
    (filter === 'open'
      ? !['refunded', 'rejected'].includes(r.status)
      : r.status === filter);
  const filteredReturns = returns.filter(
    (r) =>
      matchesFilter(r) &&
      (!admin ||
        `${r.order_number} ${r.customer_full_name} ${r.reason}`
          .toLowerCase()
          .includes(keyword.trim().toLowerCase()))
  );
  const visibleReturns = filteredReturns.slice(0, visibleCount);
  useEffect(() => {
    if (
      (selected || composing) &&
      window.matchMedia('(max-width: 950px)').matches
    ) {
      detailRef.current?.scrollIntoView({ block: 'start' });
      detailRef.current?.focus({ preventScroll: true });
    }
  }, [selected, composing]);
  function selectReturn(id: string) {
    setSelected(id);
    setComposing(false);
    setSuccess('');
    setCondition('resellable');
    setInspection('Demo inspection completed for the selected condition.');
  }
  function closeDetails() {
    setSelected('');
    setComposing(false);
    if (window.matchMedia('(max-width: 950px)').matches) {
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ block: 'start' });
        listRef.current?.focus({ preventScroll: true });
      });
    }
  }
  const order = data?.orders?.find((o) => o.uuid === orderId);
  const eligible =
    data?.orders?.filter(
      (o) =>
        o.delivered_at &&
        Date.now() - new Date(o.delivered_at).getTime() <= 7 * 86400000 &&
        o.shipment_status === 'delivered' &&
        o.items?.some((item) => item.remaining_qty > 0)
    ) || [];
  async function act(action) {
    if (busy) return;
    setPendingAction(action);
    setError('');
    try {
      await request(`${url}/${selected}`, {
        action,
        condition,
        note: inspection
      });
      await load();
      setSuccess('Return updated.');
    } catch (e) {
      setError(e.message);
    } finally {
      setPendingAction('');
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setPendingAction('request');
    setError('');
    const key = requestKey || crypto.randomUUID();
    setRequestKey(key);
    try {
      const saved = await request(url, {
        orderId,
        requestKey: key,
        reason,
        note,
        items: Object.entries(quantities)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => ({ id: Number(id), qty }))
      });
      setSelected(saved.return_id);
      setOrderId('');
      setQuantities({});
      setNote('');
      setRequestKey('');
      await load();
      setSuccess('Your return is requested. We’ll keep its progress here.');
    } catch (e) {
      setError(e.message);
    } finally {
      setPendingAction('');
    }
  }
  function chooseOrder(id) {
    setOrderId(id);
    setRequestKey('');
    const selectedOrder = eligible.find((item) => item.uuid === id);
    const firstItem = selectedOrder?.items.find(
      (item) => item.remaining_qty > 0
    );
    setQuantities(firstItem ? { [firstItem.id]: 1 } : {});
    setSuccess('');
  }
  function startReturn() {
    setSelected('');
    setComposing(true);
    setSuccess('');
    if (!orderId && eligible[0]) chooseOrder(eligible[0].uuid);
    if (!note) setNote('Sample return: the item was not as expected.');
  }
  return (
    <div
      className={`return-workspace ${
        admin ? 'seller-returns' : 'customer-returns'
      }`}
    >
      {!admin && <AccountNav active="returns" />}
      <div
        className={
          admin
            ? 'page-heading page-heading-rich flex justify-between items-center'
            : 'workspace-heading'
        }
      >
        <div
          className={admin ? 'page-heading-main flex items-center' : undefined}
        >
          {admin && (
            <span className="page-heading-symbol" aria-hidden="true">
              <RotateCcw size={22} />
            </span>
          )}
          <div className={admin ? 'page-heading-copy' : undefined}>
            {!admin && <span className="eyebrow">A little aftercare</span>}
            <h1 className={admin ? 'page-heading-title' : undefined}>
              Returns & refunds
            </h1>
            <p className={admin ? 'page-heading-description' : undefined}>
              {admin
                ? 'Keep every return moving, from first request to final refund.'
                : 'Something not quite right? Start a return and follow it from here.'}
            </p>
          </div>
        </div>
        {!admin && (
          <button
            type="button"
            className="primary-button start-return-button"
            disabled={busy || !data}
            onClick={startReturn}
          >
            <RotateCcw size={17} /> Start a return
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="notice error">
          {error} {!data && <a href="/account/login">Sign in</a>}
        </div>
      )}
      {success && (
        <div role="status" className="notice success">
          <Check size={16} />
          {success}
        </div>
      )}
      {!data && !error && (
        <LoadingState
          label="Loading your returns…"
          detail="Getting the latest requests and their progress."
          rows={4}
        />
      )}
      {admin && data && (
        <div className="metric-strip return-workspace-metrics">
          {[
            ['Review requests', 'requested', 'Approve or decline'],
            ['Awaiting items', 'approved', 'Waiting for the customer'],
            ['Inspect items', 'received', 'Record the item condition'],
            ['Ready to refund', 'inspected', 'Complete the next step']
          ].map(([label, status, hint], index) => (
            <button
              type="button"
              className={`metric-card metric-${
                ['sand', 'lavender', 'slate', 'sage'][index]
              }`}
              key={status}
              aria-pressed={filter === status}
              disabled={busy}
              onClick={() => {
                setFilter(status);
                setSelected('');
                setVisibleCount(6);
                requestAnimationFrame(() => {
                  listRef.current?.scrollIntoView({ block: 'start' });
                  listRef.current?.focus({ preventScroll: true });
                });
              }}
            >
              <div className="metric-card-heading">
                <span>{label}</span>
                <span className="metric-card-icon">
                  {React.createElement(
                    [ClipboardCheck, Truck, PackageOpen, Check][index],
                    { size: 18, 'aria-hidden': true }
                  )}
                </span>
              </div>
              <div className="metric-card-value">
                {returns.filter((r) => r.status === status).length}
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
              <div className="metric-card-foot">
                <span>{hint}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <div
        className="returns-layout"
        hidden={!data}
        style={data ? undefined : { display: 'none' }}
        data-detail-open={Boolean(current) || composing}
      >
        <section
          className="return-list panel"
          ref={listRef}
          tabIndex={-1}
          aria-label={admin ? 'Return requests' : 'Your returns'}
        >
          <div className="panel-heading">
            <h2>{admin ? 'Return requests' : 'Your returns'}</h2>
            <span className="count-pill">
              {admin
                ? `${filteredReturns.length} / ${returns.length}`
                : returns.length}
            </span>
          </div>
          <div className="filter-tabs">
            {(admin
              ? ['open', 'all', 'refunded']
              : ['all', 'requested', 'refunded']
            ).map((f) => (
              <button
                key={f}
                className={filter === f ? 'active' : ''}
                aria-pressed={filter === f}
                disabled={busy}
                onClick={() => {
                  setFilter(f);
                  if (admin) setSelected('');
                  setVisibleCount(6);
                }}
              >
                {f === 'all' ? 'All' : f === 'open' ? 'In progress' : labels[f]}
              </button>
            ))}
          </div>
          {admin && (
            <label className="return-queue-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search returns"
                disabled={busy}
                placeholder="Find an order or customer"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setVisibleCount(6);
                }}
              />
            </label>
          )}
          {visibleReturns.map((r) => (
            <button
              className={`return-row ${
                selected === r.return_id ? 'selected' : ''
              }`}
              key={r.return_id}
              aria-pressed={selected === r.return_id}
              disabled={busy}
              onClick={() => selectReturn(r.return_id)}
            >
              <span className="return-avatar">
                {admin && r.items?.[0]?.thumbnail ? (
                  <Image
                    unoptimized
                    src={r.items[0].thumbnail}
                    alt=""
                    width={72}
                    height={72}
                  />
                ) : (
                  <Package size={21} />
                )}
              </span>
              <span className="return-row-copy">
                <strong>Order {r.order_number}</strong>
                <span>{admin ? r.customer_full_name : r.reason}</span>
                <small>{date(r.created_at)}</small>
              </span>
              <span className="return-row-end">
                <span className={`status-pill ${r.status}`}>
                  {labels[r.status]}
                </span>
                <strong>{money(r.refund_minor / 100, r.currency)}</strong>
              </span>
            </button>
          ))}
          {filteredReturns.length > visibleReturns.length && (
            <div className="return-list-more">
              <span>
                Showing {visibleReturns.length} of {filteredReturns.length}
              </span>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setVisibleCount((count) => count + 6)}
              >
                Show more returns
              </button>
            </div>
          )}
          {data && !returns.length && (
            <div className="empty-state">
              <Package size={32} />
              <h3>No returns yet</h3>
              <p>
                {admin
                  ? 'New customer requests will appear here.'
                  : 'Everything in its place. If something is not quite right, start a return here.'}
              </p>
            </div>
          )}
          {data && returns.length > 0 && !filteredReturns.length && (
            <div className="empty-state">
              <Package size={28} />
              <h3>No matching returns</h3>
              <p>Try another status to see more requests.</p>
            </div>
          )}
        </section>
        <section
          className="return-detail panel"
          ref={detailRef}
          tabIndex={-1}
          aria-label={
            current
              ? 'Return details'
              : composing
              ? 'Start a return'
              : 'Return guide'
          }
        >
          {current ? (
            <>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Order {current.order_number}</span>
                  <h2>{current.reason}</h2>
                  {admin && (
                    <p className="return-owner">
                      {current.customer_full_name} · {date(current.created_at)}
                    </p>
                  )}
                </div>
                <button
                  className="icon-button"
                  aria-label="Close return details"
                  disabled={busy}
                  onClick={closeDetails}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="detail-content">
                {admin && (
                  <div className="return-next-step">
                    <ClipboardCheck size={21} />
                    <div>
                      <strong>
                        {
                          {
                            requested: 'Review this request',
                            approved: 'Waiting for returned items',
                            received: 'Inspect the returned items',
                            inspected: 'Ready for a demo refund',
                            refunded: 'Refund completed',
                            rejected: 'Request declined'
                          }[current.status]
                        }
                      </strong>
                      <p>
                        {
                          {
                            requested:
                              'Check the reason and items below before approving or declining.',
                            approved:
                              'Record receipt when the items physically arrive.',
                            received:
                              'Record their condition and your inspection notes.',
                            inspected:
                              'Review the refund total, then complete the refund below.',
                            refunded:
                              'The refund receipt and full history are saved below.',
                            rejected:
                              'The request has been closed without a refund.'
                          }[current.status]
                        }
                      </p>
                    </div>
                  </div>
                )}
                <span className={`status-pill ${current.status}`}>
                  {labels[current.status]}
                </span>
                {current.items?.map((item) => (
                  <div className="return-item" key={item.id}>
                    {item.thumbnail && (
                      <Image
                        unoptimized
                        src={item.thumbnail}
                        alt=""
                        width={72}
                        height={72}
                      />
                    )}
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.sku} · Quantity {item.qty}
                      </small>
                    </div>
                    <span>
                      {money(item.amount_minor / 100, current.currency)}
                    </span>
                  </div>
                ))}
                {current.note && <p className="detail-note">{current.note}</p>}
                <div className="return-total">
                  <span>Refund total</span>
                  <strong>
                    {money(current.refund_minor / 100, current.currency)}
                  </strong>
                </div>
                <a
                  className="quiet-link"
                  href={
                    admin
                      ? `/admin/order/edit/${current.order_uuid}`
                      : `/account/orders/${current.order_uuid}`
                  }
                >
                  View order <ArrowUpRight size={14} />
                </a>
                {admin && (
                  <div className="return-actions">
                    {current.status === 'requested' && (
                      <>
                        <Button
                          className="primary-button"
                          disabled={busy}
                          isLoading={pendingAction === 'approve'}
                          loadingText="Approving…"
                          onClick={() => act('approve')}
                        >
                          Approve return
                        </Button>
                        <Button
                          className="secondary-button"
                          disabled={busy}
                          isLoading={pendingAction === 'reject'}
                          loadingText="Declining…"
                          onClick={() => act('reject')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {current.status === 'approved' && (
                      <Button
                        className="primary-button"
                        disabled={busy}
                        isLoading={pendingAction === 'receive'}
                        loadingText="Recording receipt…"
                        onClick={() => act('receive')}
                      >
                        <Truck size={16} /> Mark items received
                      </Button>
                    )}
                    {current.status === 'received' && (
                      <div className="inspection-form">
                        <label htmlFor="return-condition">
                          Item condition
                          <select
                            id="return-condition"
                            value={condition}
                            disabled={busy}
                            onChange={(e) => setCondition(e.target.value)}
                          >
                            <option value="resellable">Resellable</option>
                            <option value="damaged">
                              Damaged — keep out of stock
                            </option>
                          </select>
                        </label>
                        <label htmlFor="return-inspection-note">
                          Inspection notes
                          <textarea
                            id="return-inspection-note"
                            value={inspection}
                            disabled={busy}
                            onChange={(e) => setInspection(e.target.value)}
                            placeholder="Record what you checked"
                            maxLength={1000}
                          />
                        </label>
                        <Button
                          className="primary-button"
                          disabled={busy || !inspection.trim()}
                          isLoading={pendingAction === 'inspect'}
                          loadingText="Saving inspection…"
                          onClick={() => act('inspect')}
                        >
                          Save inspection
                        </Button>
                      </div>
                    )}
                    {current.status === 'inspected' && (
                      <Button
                        className="primary-button"
                        disabled={busy}
                        isLoading={pendingAction === 'refund'}
                        loadingText="Processing refund…"
                        onClick={() => act('refund')}
                      >
                        Issue demo refund ·{' '}
                        {money(current.refund_minor / 100, current.currency)}
                      </Button>
                    )}
                  </div>
                )}
                {current.condition && (
                  <p className="detail-note">
                    <strong>Inspection: {current.condition}</strong>
                    <br />
                    {current.inspection_note}
                  </p>
                )}
                {current.refund_transaction_id && (
                  <div className="refund-receipt">
                    <Check size={20} />
                    <div>
                      <strong>Demo refund completed</strong>
                      <small>{current.refund_transaction_id}</small>
                    </div>
                  </div>
                )}
                <h3 className="timeline-title">Return journey</h3>
                <ol className="return-timeline">
                  {current.activity?.map((item, index) => (
                    <li key={index}>
                      <span />
                      <div>
                        <p>{item.message}</p>
                        <small>
                          {date(item.created_at)} ·{' '}
                          {item.actor === 'customer'
                            ? admin
                              ? 'Customer'
                              : 'You'
                            : item.actor}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : admin ? (
            <div className="return-next-request">
              <div className="return-next-heading">
                <ClipboardCheck size={18} />
                <span>YOUR NEXT ACTION</span>
                <span className="return-next-tag">Return workspace</span>
              </div>
              <h2>
                {filteredReturns.length
                  ? 'Start with the next request'
                  : 'You’re up to date.'}
              </h2>
              <p>
                {filteredReturns.length
                  ? 'Open a request to review its items, record an inspection or check the refund history.'
                  : 'There are no requests in this view. Choose another stage to see more.'}
              </p>
              {filteredReturns[0] && (
                <div className="return-next-preview">
                  <div className="return-next-product">
                    {filteredReturns[0].items?.[0]?.thumbnail ? (
                      <Image
                        unoptimized
                        src={filteredReturns[0].items[0].thumbnail}
                        alt=""
                        width={72}
                        height={72}
                      />
                    ) : (
                      <Package size={30} />
                    )}
                  </div>
                  <div>
                    <span className="return-next-label">
                      NEXT IN THIS QUEUE
                    </span>
                    <h3>Order {filteredReturns[0].order_number}</h3>
                    <p>
                      {filteredReturns[0].customer_full_name} ·{' '}
                      {filteredReturns[0].reason}
                    </p>
                    <span
                      className={`status-pill ${filteredReturns[0].status}`}
                    >
                      {labels[filteredReturns[0].status]}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => selectReturn(filteredReturns[0].return_id)}
                  >
                    Review request <ArrowUpRight size={16} />
                  </button>
                </div>
              )}
              <div className="return-process">
                <div>
                  <span>
                    <ClipboardCheck size={19} />
                  </span>
                  <strong>01 · Review</strong>
                  <p>Confirm the items and reason.</p>
                </div>
                <div>
                  <span>
                    <PackageOpen size={19} />
                  </span>
                  <strong>02 · Inspect</strong>
                  <p>Record receipt and condition.</p>
                </div>
                <div>
                  <span>
                    <Check size={19} />
                  </span>
                  <strong>03 · Resolve</strong>
                  <p>Issue the eligible demo refund.</p>
                </div>
              </div>
              <div className="return-next-note">
                Refunds and restocking remain separate actions.
              </div>
            </div>
          ) : !composing ? (
            <div className="return-guide">
              <span className="return-guide-icon">
                <PackageOpen size={46} strokeWidth={1.2} />
              </span>
              <span className="eyebrow">Room to change your mind</span>
              <h2>
                We’ll help you
                <br />
                find a way back.
              </h2>
              <p>
                Something not quite right? You can request a return within 7
                days of delivery.
              </p>
              <ol>
                <li>
                  <b>1</b>
                  <span>Choose your order and the items to return.</span>
                </li>
                <li>
                  <b>2</b>
                  <span>
                    We review your request and guide you through the next step.
                  </span>
                </li>
                <li>
                  <b>3</b>
                  <span>Your refund follows receipt and inspection.</span>
                </li>
              </ol>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  startReturn();
                  setSuccess('');
                }}
              >
                Start a return <ArrowUpRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="panel-heading">
                <h2>Start a return</h2>
                {composing ? (
                  <button
                    type="button"
                    className="quiet-link"
                    onClick={closeDetails}
                  >
                    Back to returns
                  </button>
                ) : (
                  <span className="small-note">Within 7 days of delivery</span>
                )}
              </div>
              <form className="detail-content return-form" onSubmit={submit}>
                <label>
                  Choose an order
                  <select
                    required
                    value={orderId}
                    onChange={(e) => chooseOrder(e.target.value)}
                  >
                    <option value="">Select a delivered order</option>
                    {eligible.map((o) => (
                      <option key={o.uuid} value={o.uuid}>
                        {o.order_number} · {money(o.grand_total, o.currency)}
                      </option>
                    ))}
                  </select>
                </label>
                {order && (
                  <fieldset>
                    <legend>Items to return</legend>
                    {order.items
                      ?.filter((item) => item.remaining_qty > 0)
                      .map((item) => (
                        <label className="item-choice" key={item.id}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.name} for return`}
                            checked={!!quantities[item.id]}
                            onChange={(e) =>
                              setQuantities((q) => ({
                                ...q,
                                [item.id]: e.target.checked ? 1 : 0
                              }))
                            }
                          />
                          {item.thumbnail && (
                            <Image
                              unoptimized
                              src={item.thumbnail}
                              alt=""
                              width={72}
                              height={72}
                            />
                          )}
                          <span>
                            {item.name}
                            <small>
                              {money(
                                item.total /
                                  order.items.find((i) => i.id === item.id).qty,
                                order.currency
                              )}{' '}
                              each
                            </small>
                          </span>
                          {!!quantities[item.id] && (
                            <input
                              className="quantity-input"
                              type="number"
                              min={1}
                              max={item.remaining_qty}
                              aria-label={`Quantity of ${item.name}`}
                              value={quantities[item.id]}
                              onChange={(e) =>
                                setQuantities((q) => ({
                                  ...q,
                                  [item.id]: Number(e.target.value)
                                }))
                              }
                            />
                          )}
                        </label>
                      ))}
                  </fieldset>
                )}
                <label>
                  Reason for return
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {reasons.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Anything else we should know?
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional details about the item"
                    maxLength={1000}
                  />
                </label>
                <p className="small-note">
                  We’ll review your request first. A refund is issued after the
                  items arrive and are checked.
                </p>
                <Button
                  className="primary-button"
                  type="submit"
                  isLoading={pendingAction === 'request'}
                  loadingText="Sending request…"
                  disabled={
                    busy ||
                    !orderId ||
                    !Object.values(quantities).some((q) => q > 0)
                  }
                >
                  Request return <ArrowUpRight size={16} />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
      {admin && data && (
        <details className="return-trends">
          <summary>
            <span>Return trends</span>
            <small>Reasons, volume and completed refunds</small>
            <span className="return-trends-action">Explore trends +</span>
          </summary>
          <React.Suspense
            fallback={<LoadingState label="Loading trends…" rows={2} />}
          >
            <ReturnInsights records={returns} />
          </React.Suspense>
        </details>
      )}
    </div>
  );
}
