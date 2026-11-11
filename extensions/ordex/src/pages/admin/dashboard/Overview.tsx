import { Image } from '@components/common/Image.js';
import React, { useEffect, useState } from 'react';
import Area from '@components/common/Area.js';
import {
  ArrowUpRight,
  Box,
  Users,
  ShoppingBag,
  RotateCcw,
  Clock3,
  ChartNoAxesCombined,
  CalendarDays
} from 'lucide-react';
import OrderCalendar from './OrderCalendar.js';
import { MetricCard } from '@components/admin/MetricCard.js';
import { LoadingState } from '@components/common/LoadingState.js';

type Summary = {
  orders: number;
  order_value: number;
  delivered: number;
  products: number;
  customers: number;
  open_returns: number;
  activity: {
    activity_id: number;
    order_number: string;
    message: string;
    created_at: string;
  }[];
  recentOrders: {
    uuid: string;
    order_number: string;
    customer_full_name: string;
    grand_total: number;
    payment_status: string;
    shipment_status: string;
    created_at: string;
    thumbnail: string | null;
    product_name: string | null;
    item_qty: number;
  }[];
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
const date = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
const status = (value: string) =>
  ({
    demo_captured: 'Paid',
    demo_refunded: 'Refunded',
    demo_partial_refunded: 'Partially refunded',
    pending: 'Unfulfilled',
    shipping: 'In transit',
    shipped: 'Shipped',
    delivered: 'Delivered'
  }[value] || value.replaceAll('_', ' '));

export default function Overview({ summaryUrl }: { summaryUrl: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch(summaryUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error('Store overview is temporarily unavailable.');
        const json = await response.json();
        if (json.error) throw new Error(json.error.message);
        setData(json.data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message);
      });
    return () => controller.abort();
  }, [summaryUrl, attempt]);
  const metrics = [
    {
      label: 'Order value',
      unit: '',
      value: data ? currency(data.order_value) : undefined,
      caption: 'All placed orders',
      Icon: ChartNoAxesCombined,
      href: '/admin/orders'
    },
    {
      label: 'Total orders',
      unit: 'orders',
      value: data?.orders,
      caption: `${data?.delivered ?? 0} delivered`,
      Icon: ShoppingBag,
      href: '/admin/orders'
    },
    {
      label: 'Customers',
      unit: 'people',
      value: data?.customers,
      caption: 'Registered accounts',
      Icon: Users,
      href: '/admin/customers'
    },
    {
      label: 'Open returns',
      unit: 'requests',
      value: data?.open_returns,
      caption: 'Awaiting the next step',
      Icon: RotateCcw,
      href: '/admin/returns'
    }
  ];
  return (
    <>
      <h1 className="sr-only">Store overview</h1>
      {error && (
        <div role="alert" className="notice error">
          {error}{' '}
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}
      <div
        className="metric-strip overview-metrics"
        aria-label="Store totals"
        aria-busy={!data && !error}
      >
        {metrics.map(({ label, value, caption, Icon, href }, index) => (
          <MetricCard
            key={label}
            label={label}
            value={value ?? '—'}
            note={caption}
            icon={<Icon size={18} />}
            href={href}
            tone={['slate', 'lavender', 'sage', 'sand'][index]}
          />
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <Area id="leftSide" noOuter />
          <div className="dashboard-lower">
            <Area id="dashboardProducts" noOuter />
            <OrderCalendar url={summaryUrl} />
          </div>
        </div>
        <div className="dashboard-secondary">
          <Area id="rightSide" noOuter />
          <section className="dashboard-activity" data-slot="card">
            <div data-slot="card-header">
              <h2 data-slot="card-title">
                <Clock3 size={16} /> Recent activity
              </h2>
              <a
                className="panel-open"
                href="/admin/orders"
                aria-label="View all orders"
              >
                <ArrowUpRight size={16} />
              </a>
            </div>
            <div data-slot="card-content">
              {data?.recentOrders.slice(0, 3).map((order) => (
                <a
                  className="activity-product"
                  href={`/admin/order/edit/${order.uuid}`}
                  key={order.uuid}
                >
                  <span className="activity-product-image">
                    {order.thumbnail ? (
                      <Image
                        unoptimized
                        src={order.thumbnail}
                        alt=""
                        width={72}
                        height={72}
                      />
                    ) : (
                      <Box size={18} />
                    )}
                  </span>
                  <span className="activity-product-copy">
                    <strong>
                      {order.product_name || `Order #${order.order_number}`}
                    </strong>
                    <small>
                      #{order.order_number} · {date(order.created_at)}
                    </small>
                  </span>
                  <span className="activity-product-status">
                    {status(order.shipment_status)}
                  </span>
                </a>
              ))}
              <a className="activity-link" href="/admin/returns">
                {data?.open_returns ?? '—'} returns need attention{' '}
                <ArrowUpRight size={14} />
              </a>
              {data && !data.recentOrders.length && (
                <p className="dashboard-empty">New orders will appear here.</p>
              )}
              {!data && !error && (
                <LoadingState label="Loading activity…" rows={2} />
              )}
            </div>
          </section>
        </div>
      </div>
      <section
        className="dashboard-recent"
        data-slot="card"
        aria-labelledby="recent-orders-heading"
      >
        <div className="panel-heading">
          <div>
            <h2 id="recent-orders-heading">Recent orders</h2>
            <p data-slot="card-description">Payment and delivery status</p>
          </div>
          <a className="quiet-link" href="/admin/orders">
            View all orders <ArrowUpRight size={14} />
          </a>
        </div>
        <div data-slot="card-content">
          <div style={{ overflowX: 'auto' }}>
            <table className="recent-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>
                    <CalendarDays size={12} /> Date
                  </th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders.map((order) => (
                  <tr key={order.uuid}>
                    <td>
                      <a href={`/admin/order/edit/${order.uuid}`}>
                        {order.order_number}
                      </a>
                    </td>
                    <td>{order.customer_full_name}</td>
                    <td>{date(order.created_at)}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          ['paid', 'demo_captured'].includes(
                            order.payment_status
                          )
                            ? 'payment-paid'
                            : order.payment_status.includes('refund')
                            ? 'payment-refunded'
                            : 'requested'
                        }`}
                      >
                        {status(order.payment_status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          order.shipment_status === 'delivered'
                            ? 'delivery-delivered'
                            : order.shipment_status === 'pending'
                            ? 'delivery-pending'
                            : 'delivery-moving'
                        }`}
                      >
                        {status(order.shipment_status)}
                      </span>
                    </td>
                    <td className="text-right">
                      {currency(order.grand_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && !data.recentOrders.length && (
            <p className="dashboard-empty">New orders will appear here.</p>
          )}
          {!data && !error && (
            <LoadingState label="Loading recent orders…" rows={3} />
          )}
        </div>
      </section>
    </>
  );
}
export const layout = { areaId: 'content', sortOrder: 10 };
export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
