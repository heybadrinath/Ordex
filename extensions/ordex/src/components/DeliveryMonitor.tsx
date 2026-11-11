import React, { useEffect, useState } from 'react';
import { Button } from '@components/common/ui/Button.js';
import { api } from './SupportWorkspace.js';
import { when } from './SupportCase.js';

export default function DeliveryMonitor() {
  const [orders, setOrders] = useState<any[]>([]),
    [selected, setSelected] = useState('');
  const [query, setQuery] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(''),
    [kind, setKind] = useState('exception'),
    [note, setNote] = useState('');
  const [dispatch, setDispatch] = useState(''),
    [expected, setExpected] = useState('');
  const load = () =>
    api('/api/support/admin?view=delivery')
      .then(setOrders)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);
  const order = orders.find((o) => o.uuid === selected);
  function choose(o) {
    setSelected(o.uuid);
    setNotice('');
    setDispatch(local(o.dispatch_due_at));
    setExpected(local(o.expected_at));
  }
  async function save(body) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api('/api/support/admin', {
        area: 'delivery',
        orderId: selected,
        ...body
      });
      await load();
      setNotice(
        body.command === 'event'
          ? 'Courier update saved. The worker will review it shortly.'
          : 'Delivery targets saved.'
      );
      setNote('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="delivery-monitor">
      <header>
        <div>
          <h2>Delivery watch</h2>
          <p>
            Spot missed dispatches and delivery problems before the customer has
            to ask.
          </p>
        </div>
        <span className="support-status">Synthetic courier</span>
      </header>
      {error && (
        <p className="support-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="delivery-notice" role="status">
          {notice}
        </p>
      )}
      <div className="delivery-layout">
        <section className="delivery-orders">
          <label>
            Find an order
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order number or customer"
            />
          </label>
          <div>
            {orders
              .filter((o) =>
                `${o.order_number} ${o.customer_full_name}`
                  .toLowerCase()
                  .includes(query.toLowerCase())
              )
              .slice(0, 30)
              .map((o) => (
                <button
                  key={o.uuid}
                  onClick={() => choose(o)}
                  aria-pressed={selected === o.uuid}
                >
                  <span>
                    <strong>#{o.order_number}</strong>
                    <small>{o.customer_full_name}</small>
                  </span>
                  <span className="support-status">
                    {(o.phase || 'Not watched').replaceAll('_', ' ')}
                  </span>
                </button>
              ))}
          </div>
        </section>
        {order ? (
          <section className="delivery-detail">
            <header>
              <h3>Order #{order.order_number}</h3>
              <a href={`/admin/order/edit/${order.uuid}`}>View order ↗</a>
            </header>
            <p>
              {order.latest
                ? `Latest update: ${order.latest.kind.replaceAll(
                    '_',
                    ' '
                  )} · ${when(order.latest.occurred_at)}. ${order.latest.note}`
                : 'No courier update recorded.'}
            </p>
            {order.follow_up_at && (
              <p>Next promised check: {when(order.follow_up_at)}</p>
            )}
            {order.case_id && (
              <a href={`/admin/support?case=${order.case_id}`}>
                Open conversation and seller brief ↗
              </a>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save({
                  command: 'watch',
                  dispatchDueAt: new Date(dispatch).toISOString(),
                  expectedAt: new Date(expected).toISOString()
                });
              }}
            >
              <h4>Delivery targets</h4>
              <p>
                New orders are watched automatically. Adjust targets here for
                this demo order.
              </p>
              <div className="delivery-fields">
                <label>
                  Dispatch by
                  <input
                    required
                    type="datetime-local"
                    value={dispatch}
                    onChange={(e) => setDispatch(e.target.value)}
                  />
                </label>
                <label>
                  Delivery target
                  <input
                    required
                    type="datetime-local"
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                  />
                </label>
              </div>
              <Button type="submit" variant="outline" disabled={busy}>
                Save targets
              </Button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save({
                  command: 'event',
                  eventId: crypto.randomUUID(),
                  kind,
                  note,
                  occurredAt: new Date().toISOString()
                });
              }}
            >
              <h4>Record a demo courier update</h4>
              <p>
                These synthetic events test the support flow. They do not book
                or contact a courier.
              </p>
              <label>
                Update
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="exception">Delivery exception</option>
                  <option value="picked_up">Picked up</option>
                  <option value="in_transit">In transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </label>
              <label>
                Courier note
                <textarea
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="Parcel held at the local hub; route needs review."
                />
              </label>
              <Button type="submit" disabled={busy || !note.trim()}>
                Save courier update
              </Button>
            </form>
          </section>
        ) : (
          <div className="support-empty">
            <h3>Choose an order</h3>
            <p>
              Review its delivery targets, courier evidence and saved follow-up.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
function local(value) {
  if (!value) return '';
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
