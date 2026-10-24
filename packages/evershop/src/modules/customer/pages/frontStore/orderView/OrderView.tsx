import { useAppState } from '@components/common/context/app.js';
import { OrderSummaryItems } from '@components/frontStore/checkout/OrderSummaryItems.js';
import { OrderTotalSummary } from '@components/frontStore/checkout/OrderTotalSummary.js';
import { OrderItem } from '@components/frontStore/customer/CustomerContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import Area from '@components/common/Area.js';
import { AccountNav } from '@components/frontStore/customer/AccountNav.js';
import {
  Package,
  Truck,
  ArrowLeft,
  ReceiptText,
  ShieldCheck
} from 'lucide-react';

interface ShipmentItem {
  uuid: string;
  qty: number;
  productSku: string | null;
  productName: string | null;
}

interface Shipment {
  uuid: string;
  shipmentId: number;
  carrier: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: {
    code: string;
    name: string;
    badge: string;
    phase: string;
  };
  phase: string;
  shippedAt: { text: string } | null;
  deliveredAt: { text: string } | null;
  canceledAt: { text: string } | null;
  createdAt: { text: string } | null;
  items: ShipmentItem[];
}

interface Order {
  orderId: number;
  uuid: string;
  orderNumber: string;
  createdAt: { text: string };
  grandTotal: { text: string };
  shipmentStatus: { name: string; code: string; badge: string } | null;
  status: { name: string; code: string; badge: string } | null;
  shippingMethodName: string | null;
  shippingMethodData: {
    snapshot?: { name?: string; cost?: number };
  } | null;
  subTotal: { text: string };
  subTotalInclTax: { text: string };
  shippingFeeInclTax: { text: string };
  shippingFeeExclTax: { text: string };
  totalTaxAmount: { text: string };
  discountAmount: { text: string };
  coupon: string | null;
  items: OrderItem[];
  shipments: Shipment[];
}

interface OrderViewProps {
  order: Order | null;
}

const StatusPill: React.FC<{ children: React.ReactNode; code?: string }> = ({
  children,
  code
}) => (
  <span
    data-status={code}
    className="order-status-pill rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
  >
    {children}
  </span>
);

function whenShipped(shipment: Shipment): string {
  // Direct pending → delivered transitions leave `shippedAt` NULL; fall back
  // to deliveredAt, then to createdAt, per the wiki guidance for templates
  // that need a "when did it ship" line.
  return (
    shipment.shippedAt?.text ??
    shipment.deliveredAt?.text ??
    shipment.createdAt?.text ??
    ''
  );
}

/**
 * Customer-facing order detail page. Shows what the customer paid for at the
 * top (the service-level quote), then a per-shipment block for each fulfillment
 * row with the actual carrier, tracking link, items, and dates.
 *
 * Design intent: the customer should never see the carrier name at checkout
 * (it's a fulfillment metadata field). This page is the FIRST surface where
 * a carrier name appears, because by definition the shipment has actually
 * been handed off.
 */
export default function OrderView({ order }: OrderViewProps) {
  const {
    config: {
      tax: { priceIncludingTax }
    }
  } = useAppState();
  if (!order) {
    return (
      <div className="account mx-auto max-w-2xl py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {_('Order not found')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {_(
            'We could not find this order. It may have been removed, or it may belong to a different account.'
          )}
        </p>
        <a
          href="/account/orders"
          className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← {_('Back to orders')}
        </a>
      </div>
    );
  }

  return (
    <div className="account customer-order-page">
      <AccountNav active="orders" />
      <div className="customer-order-detail">
        <a className="order-back-link" href="/account/orders">
          <ArrowLeft size={15} />
          Back to your orders
        </a>
        <header>
          <div>
            <span className="eyebrow">Your order</span>
            <h1>Order #{order.orderNumber}</h1>
            <p>Placed {order.createdAt?.text}</p>
          </div>
          <div className="order-heading-status">
            {order.shipmentStatus?.name && (
              <StatusPill code={order.shipmentStatus.code}>
                {order.shipmentStatus.name}
              </StatusPill>
            )}
            {order.status?.name && (
              <StatusPill code={order.status.code}>
                {order.status.name}
              </StatusPill>
            )}
          </div>
        </header>
        <div className="order-detail-grid">
          <div className="order-detail-content">
            <section className="order-products-section">
              <h2>
                <Package size={19} strokeWidth={1.5} />
                What’s in your order
              </h2>
              <div className="order-summary-panel">
                <OrderSummaryItems items={order.items} />
              </div>
            </section>
            <section className="order-delivery-section">
              <h2 className="mb-3 h5">
                <Truck size={19} />
                {_('Delivery updates')}
              </h2>
              {order.shipments.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  {_('No shipments yet — your order is being prepared.')}
                </div>
              ) : (
                <div className="space-y-3">
                  {order.shipments.map((shipment) => {
                    const trackHref = shipment.trackingUrl;
                    const carrierLabel =
                      shipment.carrierName ?? shipment.carrier;
                    const shippedText = whenShipped(shipment);
                    return (
                      <div
                        key={shipment.uuid}
                        className="customer-shipment-card space-y-3 rounded-lg border border-border p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {_('Shipment')} #{shipment.shipmentId}
                            </span>
                            <StatusPill code={shipment.status.code}>
                              {shipment.status.name}
                            </StatusPill>
                          </div>
                          {carrierLabel && (
                            <div className="text-sm text-muted-foreground">
                              {carrierLabel}
                              {shipment.trackingNumber && (
                                <> · {shipment.trackingNumber}</>
                              )}
                            </div>
                          )}
                        </div>

                        <ul className="space-y-1 text-sm">
                          {shipment.items.map((item) => (
                            <li
                              key={item.uuid}
                              className="flex gap-2 text-muted-foreground"
                            >
                              <span className="text-foreground">
                                {item.productName ??
                                  item.productSku ??
                                  _('Item')}
                              </span>
                              <span>× {item.qty}</span>
                            </li>
                          ))}
                        </ul>

                        {(shippedText ||
                          shipment.deliveredAt?.text ||
                          trackHref) && (
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {shipment.phase === 'delivered' &&
                              shipment.deliveredAt?.text && (
                                <span>
                                  {_('Delivered')} {shipment.deliveredAt.text}
                                </span>
                              )}
                            {shipment.phase === 'shipped' && shippedText && (
                              <span>
                                {_('Shipped')} {shippedText}
                              </span>
                            )}
                            {shipment.phase === 'canceled' &&
                              shipment.canceledAt?.text && (
                                <span>
                                  {_('Canceled')} {shipment.canceledAt.text}
                                </span>
                              )}
                            {trackHref && (
                              <a
                                href={trackHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-foreground hover:underline"
                              >
                                {_('Track shipment →')}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
          <aside className="order-receipt">
            <ReceiptText size={28} strokeWidth={1.3} />
            <span className="eyebrow">All in the details</span>
            <h2>Your receipt.</h2>
            <OrderTotalSummary
              shippingCost={
                priceIncludingTax
                  ? order.shippingFeeInclTax.text
                  : order.shippingFeeExclTax.text
              }
              subTotal={
                priceIncludingTax
                  ? order.subTotalInclTax.text
                  : order.subTotal.text
              }
              total={order.grandTotal.text}
              shippingMethod={order.shippingMethodName || undefined}
              coupon={order.coupon || ''}
              discountAmount={order.discountAmount.text}
              taxAmount={order.totalTaxAmount.text}
            />
            <p className="receipt-note">
              <ShieldCheck size={16} />
              This demo uses simulated payments.
            </p>
            <div className="order-receipt-help">
              <span>Need a hand with this order?</span>
              <Area id="orderViewActions" noOuter />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderUuid")) {
      orderId
      uuid
      orderNumber
      createdAt {
        text
      }
      grandTotal {
        text
      }
      shipmentStatus {
        name
        code
        badge
      }
      status {
        name
        code
        badge
      }
      shippingMethodName
      shippingMethodData {
        snapshot {
          name
          cost
        }
      }
      subTotal {
        text
      }
      subTotalInclTax {
        text
      }
      shippingFeeInclTax {
        text
      }
      shippingFeeExclTax {
        text
      }
      totalTaxAmount {
        text
      }
      discountAmount {
        text
      }
      coupon
      items {
        uuid
        productName
        thumbnail
        productSku
        qty
        productUrl
        productPrice {
          text
        }
        productPriceInclTax {
          text
        }
        variantOptions {
          attributeCode
          attributeName
          attributeId
          optionId
          optionText
        }
        lineTotalInclTax {
          text
        }
        lineTotal {
          text
        }
      }
      shipments {
        uuid
        shipmentId
        carrier
        carrierName
        trackingNumber
        trackingUrl
        status {
          code
          name
          badge
          phase
        }
        phase
        shippedAt {
          text
        }
        deliveredAt {
          text
        }
        canceledAt {
          text
        }
        createdAt {
          text
        }
        items {
          uuid
          qty
          productSku
          productName
        }
      }
    }
  }
`;
