import {
  refundOrder,
  updatePaymentStatus
} from '@evershop/evershop/oms/services';

export async function settleDemoCancellation(order, connection) {
  if (order.payment_method !== 'demo') return;
  const totals = (
    await connection.query(
      `SELECT
    coalesce(sum(amount_minor) FILTER(WHERE kind='payment'),0)::bigint AS paid,
    coalesce(sum(amount_minor) FILTER(WHERE kind='refund'),0)::bigint AS refunded
    FROM demo_payment WHERE order_id=$1`,
      [order.order_id]
    )
  ).rows[0];
  const amount = Number(totals.paid) - Number(totals.refunded);
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error('The payment balance needs review before cancellation.');
  const key = `cancel:${order.uuid}`;
  if (
    amount > 0 &&
    order.status === 'canceled' &&
    order.payment_status === 'canceled'
  ) {
    // Restore the ledger-backed capture state within this transaction before repair.
    await updatePaymentStatus(
      order.order_id,
      Number(totals.refunded) > 0 ? 'demo_partial_refunded' : 'demo_captured',
      connection
    );
  }
  if (amount > 0)
    await refundOrder(order.uuid, amount / 100, {
      operationId: key,
      connection
    });
  const payment = (
    await connection.query(
      "SELECT * FROM demo_payment WHERE operation_key=$1 AND kind='refund'",
      [key]
    )
  ).rows[0];
  if (
    amount > 0 &&
    (!payment ||
      Number(payment.amount_minor) !== amount ||
      payment.currency !== order.currency)
  ) {
    throw new Error('The cancellation refund could not be verified.');
  }
  await connection.query(
    `INSERT INTO order_cancellation(order_id,refund_minor,currency,transaction_id)
    VALUES($1,$2,$3,$4) ON CONFLICT(order_id) DO NOTHING`,
    [order.order_id, amount, order.currency, payment?.transaction_id || null]
  );
}
