import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Package,
  RotateCcw,
  Truck,
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
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState('');
  const [filter, setFilter] = useState('all');
  const [orderId, setOrderId] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState(reasons[0]);
  const [note, setNote] = useState('');
  const [condition, setCondition] = useState('resellable');
  const [inspection, setInspection] = useState('');
  const [requestKey, setRequestKey] = useState('');
  const [success, setSuccess] = useState('');
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
  }, []);
  const returns = (admin ? data : data?.returns) || [];
  const current = returns.find((r) => r.return_id === selected);
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
    setBusy(true);
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
      setBusy(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
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
      setBusy(false);
    }
  }
  function chooseOrder(id) {
    setOrderId(id);
    setRequestKey('');
    setQuantities({});
    setSuccess('');
  }
  return (
    <div
      className={`return-workspace ${
        admin ? 'seller-returns' : 'customer-returns'
      }`}
    >
      {!admin && (
        <a className="quiet-link" href="/account">
          <ArrowLeft size={15} /> Your account
        </a>
      )}
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">
            {admin ? 'Order care' : 'Here to help'}
          </span>
          <h1>{admin ? 'Returns' : 'A little care, after checkout.'}</h1>
          <p>
            {admin
              ? 'Keep every return moving, from first request to final refund.'
              : 'Something not quite right? Start a return and follow it from here.'}
          </p>
        </div>
        <span className="round-icon">
          <RotateCcw size={27} />
        </span>
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
      {!data && !error && <p role="status">Loading your returns…</p>}
      {admin && data && (
        <div className="return-metrics">
          {[
            [
              'Open returns',
              returns.filter(
                (r) => !['refunded', 'rejected'].includes(r.status)
              ).length
            ],
            [
              'Awaiting inspection',
              returns.filter((r) => r.status === 'received').length
            ],
            [
              'Refunded',
              money(
                returns
                  .filter((r) => r.status === 'refunded')
                  .reduce((n, r) => n + Number(r.refund_minor) / 100, 0)
              )
            ]
          ].map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="returns-layout">
        <section className="return-list panel">
          <div className="panel-heading">
            <h2>{admin ? 'Return requests' : 'Your returns'}</h2>
            <span className="count-pill">{returns.length}</span>
          </div>
          {admin && (
            <div className="filter-tabs">
              {['all', 'requested', 'received', 'refunded'].map((f) => (
                <button
                  key={f}
                  className={filter === f ? 'active' : ''}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : labels[f]}
                </button>
              ))}
            </div>
          )}
          {returns
            .filter((r) => filter === 'all' || r.status === filter)
            .map((r) => (
              <button
                className={`return-row ${
                  selected === r.return_id ? 'selected' : ''
                }`}
                key={r.return_id}
                onClick={() => {
                  setSelected(r.return_id);
                  setSuccess('');
                  setCondition('resellable');
                  setInspection('');
                }}
              >
                <span className="return-avatar">
                  <Package size={21} />
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
          {data && !returns.length && (
            <div className="empty-state">
              <Package size={32} />
              <h3>No returns yet</h3>
              <p>
                {admin
                  ? 'New customer requests will appear here.'
                  : 'Everything in its place. If you need a return, start one alongside.'}
              </p>
            </div>
          )}
        </section>
        <section className="return-detail panel">
          {current ? (
            <>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Order {current.order_number}</span>
                  <h2>{current.reason}</h2>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close return details"
                  onClick={() => setSelected('')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="detail-content">
                <span className={`status-pill ${current.status}`}>
                  {labels[current.status]}
                </span>
                {current.items?.map((item) => (
                  <div className="return-item" key={item.id}>
                    {item.thumbnail && <img src={item.thumbnail} alt="" />}
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
                        <button
                          className="primary-button"
                          disabled={busy}
                          onClick={() => act('approve')}
                        >
                          Approve return
                        </button>
                        <button
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => act('reject')}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {current.status === 'approved' && (
                      <button
                        className="primary-button"
                        disabled={busy}
                        onClick={() => act('receive')}
                      >
                        <Truck size={16} /> Mark items received
                      </button>
                    )}
                    {current.status === 'received' && (
                      <div className="inspection-form">
                        <label>
                          Item condition
                          <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                          >
                            <option value="resellable">Resellable</option>
                            <option value="damaged">
                              Damaged — keep out of stock
                            </option>
                          </select>
                        </label>
                        <label>
                          Inspection notes
                          <textarea
                            value={inspection}
                            onChange={(e) => setInspection(e.target.value)}
                            placeholder="Record what you checked"
                            maxLength={1000}
                          />
                        </label>
                        <button
                          className="primary-button"
                          disabled={busy || !inspection.trim()}
                          onClick={() => act('inspect')}
                        >
                          Save inspection
                        </button>
                      </div>
                    )}
                    {current.status === 'inspected' && (
                      <button
                        className="primary-button"
                        disabled={busy}
                        onClick={() => act('refund')}
                      >
                        Issue demo refund ·{' '}
                        {money(current.refund_minor / 100, current.currency)}
                      </button>
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
            <div className="empty-state">
              <RotateCcw size={34} />
              <h3>A clear view of every return.</h3>
              <p>
                Select a request to review its items, record an inspection or
                issue a refund.
              </p>
            </div>
          ) : (
            <>
              <div className="panel-heading">
                <h2>Start a return</h2>
                <span className="small-note">Within 7 days of delivery</span>
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
                    {order.items?.filter((item) => item.remaining_qty > 0).map((item) => (
                      <label className="item-choice" key={item.id}>
                        <input
                          type="checkbox"
                          checked={!!quantities[item.id]}
                          onChange={(e) =>
                            setQuantities((q) => ({
                              ...q,
                              [item.id]: e.target.checked ? 1 : 0
                            }))
                          }
                        />
                        {item.thumbnail && <img src={item.thumbnail} alt="" />}
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
                <button
                  className="primary-button"
                  disabled={
                    busy ||
                    !orderId ||
                    !Object.values(quantities).some((q) => q > 0)
                  }
                >
                  {busy ? 'Sending…' : 'Request return'}{' '}
                  <ArrowUpRight size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
