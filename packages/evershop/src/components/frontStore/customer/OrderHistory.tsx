import { Image } from '@components/common/Image.js';
import { ArrowUpRight, Package, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Order, useCustomer } from './CustomerContext.js';

function orderTimestamp(order: Order) {
  const value = order.createdAt?.value || '';
  return Number(value) || Date.parse(value) || 0;
}

export function filterCustomerOrders(
  orders: Order[],
  status: string,
  keyword: string
) {
  const query = keyword.trim().toLowerCase();
  return orders
    .filter((order) => {
      const code = order.shipmentStatus?.code || '';
      const matchesStatus =
        status === 'all' ||
        (status === 'delivered'
          ? code === 'delivered'
          : [
              'shipped',
              'shipping',
              'in_transit',
              'partially_shipped',
              'partially_delivered'
            ].includes(code));
      return (
        matchesStatus &&
        (!query ||
          `${order.orderNumber} ${order.items
            ?.map((item) => item.productName)
            .join(' ')}`
            .toLowerCase()
            .includes(query))
      );
    })
    .sort(
      (a, b) =>
        orderTimestamp(b) - orderTimestamp(a) ||
        Number(b.orderId) - Number(a.orderId)
    );
}

export default function OrderHistory({
  title,
  limit,
  showFilters = false
}: {
  title?: string;
  limit?: number;
  showFilters?: boolean;
}) {
  const { customer } = useCustomer();
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const allOrders = customer?.orders || [];
  const matching = filterCustomerOrders(allOrders, status, keyword);
  const orders = matching.slice(
    0,
    limit ?? (showFilters ? visibleCount : matching.length)
  );
  return (
    <div className="order-history">
      {title && <h2>{title}</h2>}
      {showFilters && (
        <div className="customer-order-tools">
          <div
            className="order-filter-tabs"
            role="group"
            aria-label="Filter your orders"
          >
            {[
              ['all', 'All orders'],
              ['on_the_way', 'On the way'],
              ['delivered', 'Delivered']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  setVisibleCount(6);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="order-search">
            <Search size={17} />
            <input
              type="search"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setVisibleCount(6);
              }}
              placeholder="Find an order or item"
              aria-label="Search your orders"
            />
          </label>
        </div>
      )}
      {orders.length ? (
        <div className="order-history-list">
          {orders.map((order) => (
            <a
              key={order.orderId}
              href={`/account/orders/${order.uuid}`}
              className="customer-order-row"
            >
              <span className="customer-order-thumb">
                {order.items?.[0]?.thumbnail ? (
                  <Image
                    src={order.items[0].thumbnail}
                    alt=""
                    width={80}
                    height={80}
                  />
                ) : (
                  <Package size={26} strokeWidth={1.4} />
                )}
              </span>
              <span className="customer-order-copy">
                <small>
                  Order #{order.orderNumber}{' '}
                  <span>· {order.createdAt?.text}</span>
                </small>
                <strong>
                  {order.items?.[0]?.productName ||
                    `Order ${order.orderNumber}`}
                </strong>
                <span>
                  {order.items?.length > 1
                    ? `+ ${order.items.length - 1} more ${
                        order.items.length === 2 ? 'item' : 'items'
                      }`
                    : 'View your order details'}
                </span>
              </span>
              <span
                className={`order-delivery-label ${
                  order.shipmentStatus?.code === 'delivered'
                    ? 'delivered'
                    : 'moving'
                }`}
              >
                <i />
                {order.shipmentStatus?.name || order.status?.name}
              </span>
              <span className="customer-order-amount">
                {order.grandTotal.text}
                <ArrowUpRight size={18} />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="order-empty">
          <Package size={36} strokeWidth={1.2} />
          <h3>
            {allOrders.length
              ? 'No orders match this view.'
              : 'Your first good find is waiting.'}
          </h3>
          <p>
            {allOrders.length
              ? 'Try another order number, item or delivery status.'
              : 'Once you place an order, its progress will appear here.'}
          </p>
          {!allOrders.length && (
            <a href="/products" className="primary-button">
              Explore the collection <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      )}
      {showFilters && (
        <div className="order-list-footer">
          <span aria-live="polite">
            Showing {orders.length} of {matching.length}{' '}
            {matching.length === 1 ? 'order' : 'orders'}
          </span>
          {orders.length < matching.length && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setVisibleCount((count) => count + 6)}
            >
              Show more orders
            </button>
          )}
        </div>
      )}
    </div>
  );
}
