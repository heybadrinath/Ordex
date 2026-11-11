import config from 'config';
import { registerPaymentMethod } from '@evershop/evershop/checkout/services';
import { hookAfter, hookBefore } from '@evershop/evershop/lib/util/hookable';
import { settleDemoCancellation } from './services/cancellations.js';
import {
  addPaymentTransaction,
  updatePaymentStatus,
  registerCarrier
} from '@evershop/evershop/oms/services';
import { pool } from '@evershop/evershop/lib/postgres';
import { registerEmailService } from '@evershop/evershop/lib/mail/emailHelper';

export default async function bootstrap(context: { process?: string } = {}) {
  registerEmailService({
    sendEmail: async ({ to, subject }) => {
      await pool.query(
        'INSERT INTO demo_email(recipient,subject) VALUES($1,$2)',
        [to, subject]
      );
    }
  });
  registerCarrier({
    code: 'demo',
    name: 'Ordex delivery · demo',
    capabilities: {},
    generateTrackingUrl: () => null
  } as any);
  config.util.setModuleDefaults('oms', {
    order: {
      paymentStatus: {
        demo_captured: {
          name: 'Paid · demo',
          badge: 'success',
          isRefundable: true,
          isCancelable: true
        },
        demo_partial_refunded: {
          name: 'Partially refunded · demo',
          badge: 'warning',
          isRefundable: true
        },
        demo_refunded: {
          name: 'Refunded · demo',
          badge: 'default',
          isRefundable: false
        }
      },
      psoMapping: {
        'demo_captured:*': 'processing',
        'demo_captured:delivered': 'completed',
        'demo_partial_refunded:*': 'processing',
        'demo_partial_refunded:delivered': 'completed',
        'demo_refunded:*': 'closed'
      }
    }
  });
  registerPaymentMethod({
    init: () => ({ code: 'demo', name: 'Demo payment · no money is charged' }),
    validator: () => true,
    supportsPartialRefund: true,
    refund: async ({ order, amount, currency, operationId, connection }) => {
      if (!operationId || !connection)
        throw new Error(
          'Demo refunds require a verified operation and transaction.'
        );
      const amountMinor = Math.round(amount * 100);
      const transactionId = `demo-refund-${operationId}`;
      await connection.query(
        `INSERT INTO demo_payment(operation_key,transaction_id,order_id,kind,amount_minor,currency)
         VALUES($1,$2,$3,'refund',$4,$5) ON CONFLICT(operation_key) DO NOTHING`,
        [operationId, transactionId, order.order_id, amountMinor, currency]
      );
      const {
        rows: [saved]
      } = await connection.query(
        'SELECT * FROM demo_payment WHERE operation_key=$1',
        [operationId]
      );
      if (
        saved.order_id !== order.order_id ||
        Number(saved.amount_minor) !== amountMinor ||
        saved.currency !== currency
      ) {
        throw new Error(
          'This operation key was already used with different refund details.'
        );
      }
      return {
        transactionId: saved.transaction_id,
        amount,
        currency,
        offline: true,
        raw: { simulated: true, operationId }
      };
    }
  });
  hookBefore(
    'updatePaymentStatusToCancel',
    async function (_orderId, connection) {
      await settleDemoCancellation(this.order, connection);
    }
  );
  hookAfter(
    'saveOrder',
    async function initializeDemoPayment(order, _cart, connection) {
      if (order.payment_method !== 'demo') return;
      const amount = Number(order.grand_total);
      const transactionId = `demo-payment-${order.uuid}`;
      await connection.query(
        `INSERT INTO demo_payment(operation_key,transaction_id,order_id,kind,amount_minor,currency)
       VALUES($1,$1,$2,'payment',$3,$4) ON CONFLICT DO NOTHING`,
        [
          transactionId,
          order.order_id,
          Math.round(amount * 100),
          order.currency
        ]
      );
      await addPaymentTransaction(
        connection,
        order.order_id,
        amount,
        transactionId,
        'offline',
        'capture'
      );
      await updatePaymentStatus(order.order_id, 'demo_captured', connection);
      await connection.query(
        `INSERT INTO support_delivery_watch(order_id,dispatch_due_at,expected_at,next_check_at)
        VALUES($1,now()+interval '24 hours',now()+interval '72 hours',now()+interval '24 hours')
        ON CONFLICT(order_id) DO NOTHING`,
        [order.order_id]
      );
    }
  );
  if (context.process === 'cronjob') {
    const { startAgent } = await import('./services/support/agent.js');
    startAgent();
  }
}
