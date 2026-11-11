const date = (value) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export async function deliveryContext(db, order) {
  const [shipments, events, watches] = await Promise.all([
    db.query(
      'SELECT carrier,tracking_number,status,shipped_at,delivered_at FROM shipment WHERE shipment_order_id=$1 ORDER BY created_at DESC',
      [order.order_id]
    ),
    db.query(
      'SELECT event_id,kind,occurred_at,note FROM support_delivery_event WHERE order_id=$1 ORDER BY occurred_at DESC,created_at DESC LIMIT 8',
      [order.order_id]
    ),
    db.query(
      'SELECT dispatch_due_at,expected_at,follow_up_at,phase FROM support_delivery_watch WHERE order_id=$1',
      [order.order_id]
    )
  ]);
  const watch = watches.rows[0] || null;
  const latest = events.rows[0] || null;
  const delivered =
    order.shipment_status === 'delivered' || latest?.kind === 'delivered';
  const canceled =
    order.status === 'canceled' || order.shipment_status === 'canceled';
  const dispatched =
    shipments.rows.some((s) => s.shipped_at || s.delivered_at) ||
    events.rows.some((e) =>
      ['picked_up', 'in_transit', 'delivered'].includes(e.kind)
    );
  const late = watch && new Date(watch.expected_at).getTime() < Date.now();
  const risk =
    canceled || delivered
      ? null
      : latest?.kind === 'exception'
      ? 'exception'
      : late
      ? 'delivery_overdue'
      : watch &&
        !dispatched &&
        new Date(watch.dispatch_due_at).getTime() < Date.now()
      ? 'dispatch_overdue'
      : null;
  return {
    shipments: shipments.rows,
    events: events.rows,
    watch,
    latest,
    delivered,
    canceled,
    dispatched,
    risk
  };
}

export function deliveryAnswer(order, d) {
  if (d.canceled)
    return `Order #${order.order_number} is canceled. It will not be dispatched.`;
  if (d.delivered) {
    const at =
      d.latest?.kind === 'delivered'
        ? d.latest.occurred_at
        : order.delivered_at;
    return `Order #${order.order_number} is recorded as delivered${
      at ? ` on ${date(at)} IST` : ''
    }. If you have not received it, ask for a person here so the seller can investigate.`;
  }
  let result = `Order #${order.order_number} ${
    d.dispatched
      ? 'is on its way'
      : 'is being prepared; dispatch has not been recorded yet'
  }.`;
  const shipment = d.shipments.find((s) => s.tracking_number);
  if (shipment)
    result += ` Carrier: ${
      shipment.carrier === 'demo' ? 'Demo courier' : shipment.carrier
    }. Tracking: ${shipment.tracking_number}.`;
  if (d.latest)
    result += ` Latest courier update: ${d.latest.kind.replaceAll(
      '_',
      ' '
    )} on ${date(d.latest.occurred_at)} IST${
      d.latest.note ? ` — ${d.latest.note.replace(/[.!?]+$/, '')}` : ''
    }.`;
  if (d.watch)
    result += `\n\nThe delivery target is ${date(
      d.watch.expected_at
    )} IST; this is an estimate, not a confirmed arrival time.`;
  else
    result += '\n\nThere is no confirmed delivery estimate on this order yet.';
  if (d.risk)
    result +=
      d.risk === 'exception'
        ? '\n\nThe courier reported a delivery problem. The seller needs to confirm how it will be resolved.'
        : '\n\nThe dispatch or delivery deadline has passed. The seller needs to check the delay.';
  if (d.watch?.follow_up_at && !['resolved', 'stopped'].includes(d.watch.phase))
    result += `\nI will check again by ${date(
      d.watch.follow_up_at
    )} IST and post an update here when there is new information.`;
  else if (!d.risk && d.watch)
    result +=
      ' I will update this conversation if a delivery risk is detected.';
  return result;
}
