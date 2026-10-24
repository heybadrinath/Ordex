import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';
import { ShoppingBag, CreditCard, PackageCheck, Truck } from 'lucide-react';

export interface OrderEditPageHeadingProps {
  backUrl: string;
  order: {
    orderNumber: string;
    totalQty: number;
    grandTotal: { text: string };
    items: { noShippingRequired: boolean; qty: number }[];
    shipments: {
      phase: string;
      items: { qty: number }[];
      shippedAt?: { text: string };
      deliveredAt?: { text: string };
    }[];
    createdAt: { text: string };
    paymentStatus: { name: string; code: string };
    shipmentStatus: { name: string; code: string };
  };
}

export default function OrderEditPageHeading({
  backUrl,
  order
}: OrderEditPageHeadingProps) {
  const physical = order.items
    .filter((item) => !item.noShippingRequired)
    .reduce((n, item) => n + item.qty, 0);
  const delivered = order.shipments
    .filter((s) => s.phase === 'delivered')
    .reduce((n, s) => n + s.items.reduce((sum, item) => sum + item.qty, 0), 0);
  const shipped = order.shipments
    .filter((s) => s.phase === 'shipped')
    .reduce((n, s) => n + s.items.reduce((sum, item) => sum + item.qty, 0), 0);
  const pending = Math.max(0, physical - delivered - shipped);
  return (
    <>
      <PageHeading
        backUrl={backUrl}
        heading={`Order #${order.orderNumber}`}
        eyebrow="Order details"
        description={`Placed ${order.createdAt.text}`}
        icon={<ShoppingBag size={24} />}
      />
      <div className="order-progress" aria-label="Current order status">
        <div>
          <span className="order-progress-icon">
            <ShoppingBag size={19} />
          </span>
          <span>
            <small>Order value</small>
            <strong>{order.grandTotal.text}</strong>
            <em>{order.totalQty} items in this order</em>
          </span>
        </div>
        <div data-state={order.paymentStatus.code}>
          <span className="order-progress-icon">
            <CreditCard size={19} />
          </span>
          <span>
            <small>Payment</small>
            <strong>{order.paymentStatus.name}</strong>
          </span>
        </div>
        <div data-state={order.shipmentStatus.code}>
          <span className="order-progress-icon">
            <Truck size={19} />
          </span>
          <span>
            <small>Delivery</small>
            <strong>{order.shipmentStatus.name}</strong>
          </span>
        </div>
        <a
          href={`/admin/returns?order=${encodeURIComponent(order.orderNumber)}`}
        >
          <PackageCheck size={16} /> Returns for this order
        </a>
      </div>
      {physical > 0 && (
        <section
          className="order-fulfilment-strip"
          aria-label="Item fulfilment progress"
        >
          <div>
            <span
              className="fulfilment-ring"
              style={{
                background: `conic-gradient(#5e8ead ${
                  (delivered / physical) * 100
                }%, #e6e9ed 0)`
              }}
              aria-hidden="true"
            >
              <span>
                {Math.round((delivered / physical) * 100)}
                <small>%</small>
              </span>
            </span>
            <span>
              <strong>
                {delivered} of {physical} items delivered
              </strong>
              <small>
                {order.shipments.length} shipment
                {order.shipments.length === 1 ? '' : 's'} · physical items only
              </small>
            </span>
          </div>
          <div className="fulfilment-visual">
            <div
              className="segmented-rail"
              role="img"
              aria-label={`${delivered} delivered, ${shipped} in transit, ${pending} awaiting dispatch`}
            >
              <span
                style={{
                  width: `${(delivered / physical) * 100}%`,
                  background: '#528fad'
                }}
              />
              <span
                style={{
                  width: `${(shipped / physical) * 100}%`,
                  background: '#aacbdc'
                }}
              />
              <span
                style={{
                  width: `${(pending / physical) * 100}%`,
                  background: '#e8e8ed'
                }}
              />
            </div>
            <div className="fulfilment-key">
              <span>
                Delivered <b>{delivered}</b>
              </span>
              <span>
                In transit <b>{shipped}</b>
              </span>
              <span>
                Awaiting dispatch <b>{pending}</b>
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId", null)) {
      orderNumber
      totalQty
      grandTotal { text }
      items { noShippingRequired qty }
      shipments { phase items { qty } shippedAt { text(format: "LLL dd") } deliveredAt { text(format: "LLL dd") } }
      createdAt { text }
      paymentStatus { name code }
      shipmentStatus { name code }
    }
    backUrl: url(routeId: "orderGrid")
  }
`;
