import { createHash } from 'node:crypto';
import { pool } from '@evershop/evershop/lib/postgres';
import { refundOrder } from '@evershop/evershop/oms/services';

export const reasons = [
  'Arrived damaged',
  'Not as expected',
  'Wrong item',
  'Changed my mind',
  'Other'
];
const fail = (message: string, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

async function transaction(work) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    // Core query helpers release only connections outside their own transaction.
    connection.INTRANSACTION = true;
    const result = await work(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.INTRANSACTION = false;
    connection.release();
  }
}

export async function listOrders(customerId: number) {
  const { rows } = await pool.query(
    `
    SELECT o.uuid, o.order_number, o.grand_total, o.currency, o.shipment_status, o.payment_status,
      o.created_at,
      (SELECT max(s.delivered_at) FROM shipment s WHERE s.shipment_order_id=o.order_id) AS delivered_at,
      (SELECT jsonb_agg(jsonb_build_object('id',i.order_item_id,'name',i.product_name,'sku',i.product_sku,
        'thumbnail',i.thumbnail,'qty',i.qty,'total',i.line_total_with_discount_incl_tax,
        'remaining_qty',i.qty-coalesce((SELECT sum(ri.qty) FROM customer_return_item ri
          JOIN customer_return r USING(return_id)
          WHERE ri.order_item_id=i.order_item_id AND r.status <> 'rejected'),0)))
       FROM order_item i WHERE i.order_item_order_id=o.order_id) AS items
    FROM "order" o WHERE o.customer_id=$1 ORDER BY o.created_at DESC`,
    [customerId]
  );
  return rows;
}

export async function listReturns(customerId?: number) {
  const { rows } = await pool.query(
    `
    SELECT r.*, o.uuid AS order_uuid, o.order_number, o.currency, o.customer_full_name,
      o.customer_email,
      (SELECT jsonb_agg(jsonb_build_object('id',i.order_item_id,'name',i.product_name,
        'thumbnail',i.thumbnail,'sku',i.product_sku,'qty',ri.qty,'amount_minor',ri.amount_minor))
       FROM customer_return_item ri JOIN order_item i USING(order_item_id) WHERE ri.return_id=r.return_id) AS items,
      (SELECT jsonb_agg(jsonb_build_object('message',a.message,'actor',a.actor,'created_at',a.created_at)
        ORDER BY a.created_at) FROM return_activity a WHERE a.return_id=r.return_id) AS activity
    FROM customer_return r JOIN "order" o USING(order_id)
    WHERE ($1::integer IS NULL OR r.customer_id=$1)
    ORDER BY r.created_at DESC`,
    [customerId ?? null]
  );
  return rows;
}

export async function createReturn(customerId: number, input) {
  if (
    !input ||
    typeof input.orderId !== 'string' ||
    !/^[a-f0-9-]{36}$/i.test(input.orderId)
  )
    fail('Choose an order.');
  if (!reasons.includes(input.reason)) fail('Choose a return reason.');
  if (
    typeof input.requestKey !== 'string' ||
    !/^[a-z0-9-]{8,100}$/i.test(input.requestKey)
  )
    fail('A request identifier is required.');
  if (
    !Array.isArray(input.items) ||
    !input.items.length ||
    input.items.length > 40
  )
    fail('Choose at least one item.');
  const items = input.items
    .map((i) => ({ id: Number(i.id), qty: Number(i.qty) }))
    .sort((a, b) => a.id - b.id);
  if (
    items.some(
      (i) =>
        !Number.isSafeInteger(i.id) || !Number.isSafeInteger(i.qty) || i.qty < 1
    ) ||
    new Set(items.map((i) => i.id)).size !== items.length
  )
    fail('Enter valid item quantities.');
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length > 1000) fail('Keep the note under 1,000 characters.');
  const hash = createHash('sha256')
    .update(
      JSON.stringify({
        orderId: input.orderId,
        items,
        reason: input.reason,
        note
      })
    )
    .digest('hex');
  return transaction(async (connection) => {
    const {
      rows: [order]
    } = await connection.query(
      'SELECT * FROM "order" WHERE uuid=$1 AND customer_id=$2 FOR UPDATE',
      [input.orderId, customerId]
    );
    if (!order) fail('Order not found.', 404);
    const {
      rows: [existing]
    } = await connection.query(
      'SELECT * FROM customer_return WHERE customer_id=$1 AND request_key=$2',
      [customerId, input.requestKey]
    );
    if (existing) {
      if (existing.request_hash !== hash)
        fail(
          'This request identifier already belongs to different return details.',
          409
        );
      return existing;
    }
    const {
      rows: [delivery]
    } = await connection.query(
      'SELECT max(delivered_at) AS delivered_at FROM shipment WHERE shipment_order_id=$1',
      [order.order_id]
    );
    if (!delivery?.delivered_at || order.shipment_status !== 'delivered')
      fail('Returns open after the order has been delivered.');
    if (Date.now() - new Date(delivery.delivered_at).getTime() > 7 * 86400000)
      fail('The seven-day return window has closed.');
    const selected = [];
    let totalMinor = 0;
    for (const item of items) {
      const {
        rows: [line]
      } = await connection.query(
        `SELECT i.*,
        coalesce((SELECT sum(ri.qty) FROM customer_return_item ri JOIN customer_return r USING(return_id)
          WHERE ri.order_item_id=i.order_item_id AND r.status <> 'rejected'),0) AS used_qty,
        coalesce((SELECT sum(ri.amount_minor) FROM customer_return_item ri JOIN customer_return r USING(return_id)
          WHERE ri.order_item_id=i.order_item_id AND r.status <> 'rejected'),0) AS used_minor
        FROM order_item i WHERE i.order_item_order_id=$1 AND i.order_item_id=$2`,
        [order.order_id, item.id]
      );
      if (!line || item.qty > Number(line.qty) - Number(line.used_qty))
        fail('A selected quantity is already returned or exceeds this order.');
      const lineMinor = Math.round(
        Number(line.line_total_with_discount_incl_tax) * 100
      );
      const amountMinor =
        item.qty === Number(line.qty) - Number(line.used_qty)
          ? lineMinor - Number(line.used_minor)
          : Math.floor((lineMinor * item.qty) / Number(line.qty));
      selected.push({ ...item, amountMinor });
      totalMinor += amountMinor;
    }
    const {
      rows: [saved]
    } = await connection.query(
      `INSERT INTO customer_return(order_id,customer_id,request_key,request_hash,reason,note,refund_minor)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        order.order_id,
        customerId,
        input.requestKey,
        hash,
        input.reason,
        note,
        totalMinor
      ]
    );
    for (const item of selected)
      await connection.query(
        'INSERT INTO customer_return_item(return_id,order_item_id,qty,amount_minor) VALUES($1,$2,$3,$4)',
        [saved.return_id, item.id, item.qty, item.amountMinor]
      );
    await connection.query(
      'INSERT INTO return_activity(return_id,actor,message) VALUES($1,$2,$3)',
      [saved.return_id, 'customer', 'Return requested.']
    );
    return saved;
  });
}

export async function updateReturn(
  id: string,
  action: string,
  input,
  seller: string
) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) fail('Return not found.', 404);
  return transaction(async (connection) => {
    const {
      rows: [record]
    } = await connection.query(
      'SELECT * FROM customer_return WHERE return_id=$1 FOR UPDATE',
      [id]
    );
    if (!record) fail('Return not found.', 404);
    const transitions = {
      approve: ['requested', 'approved'],
      receive: ['approved', 'received'],
      inspect: ['received', 'inspected'],
      reject: ['requested', 'rejected'],
      refund: ['inspected', 'refunded']
    };
    const transition = transitions[action];
    if (!transition) fail('Unknown return action.');
    if (record.status === transition[1]) return record;
    if (record.status !== transition[0])
      fail('This action is not available in the current return status.', 409);
    let message = '';
    if (action === 'inspect') {
      if (!['resellable', 'damaged'].includes(input.condition))
        fail('Record whether the items are resellable or damaged.');
      const note = String(input.note || '').trim();
      if (!note || note.length > 1000)
        fail('Add an inspection note of up to 1,000 characters.');
      await connection.query(
        'UPDATE customer_return SET condition=$2,inspection_note=$3,inspected_at=now() WHERE return_id=$1',
        [id, input.condition, note]
      );
      message = `Inspection complete: ${input.condition}. ${note}`;
    } else if (action === 'receive') {
      await connection.query(
        'UPDATE customer_return SET received_at=now() WHERE return_id=$1',
        [id]
      );
      message = 'Returned items received.';
    } else if (action === 'refund') {
      await connection.query(
        'SELECT order_id FROM "order" WHERE order_id=$1 FOR UPDATE',
        [record.order_id]
      );
      const {
        rows: [order]
      } = await connection.query('SELECT * FROM "order" WHERE order_id=$1', [
        record.order_id
      ]);
      if (order.payment_method !== 'demo')
        fail('This demonstration only refunds synthetic payments.');
      await refundOrder(order.uuid, Number(record.refund_minor) / 100, {
        connection,
        operationId: id
      });
      const reference = `demo-refund-${id}`;
      await connection.query(
        'UPDATE customer_return SET refund_transaction_id=$2,refunded_at=now() WHERE return_id=$1',
        [id, reference]
      );
      message = `Demo refund completed. Reference: ${reference}`;
    } else
      message =
        action === 'approve'
          ? 'Return approved. Send the items to the seller.'
          : 'Return declined.';
    const {
      rows: [saved]
    } = await connection.query(
      'UPDATE customer_return SET status=$2,updated_at=now() WHERE return_id=$1 RETURNING *',
      [id, transition[1]]
    );
    await connection.query(
      'INSERT INTO return_activity(return_id,actor,message) VALUES($1,$2,$3)',
      [id, seller, message]
    );
    return saved;
  });
}

export function apiError(response, error) {
  const status = Number(error.status) || 500;
  response
    .status(status)
    .json({
      error: {
        message:
          status === 500
            ? 'The operation could not be completed. Please try again.'
            : error.message
      }
    });
  if (status === 500) console.error(error);
}
