import { Card } from '@components/common/ui/Card';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { CustomerHistoryChart } from '@components/admin/CustomerInsights.js';

export default function OrderHistory({ customer: { orders = [] } }) {
  const [keyword, setKeyword] = useState('');
  const [visible, setVisible] = useState(6);
  const filtered = [...orders]
    .filter((order) =>
      order.orderNumber.toLowerCase().includes(keyword.trim().toLowerCase())
    )
    .sort(
      (a, b) =>
        (Number(b.createdAt.value) || Date.parse(b.createdAt.value) || 0) -
        (Number(a.createdAt.value) || Date.parse(a.createdAt.value) || 0)
    );
  return (
    <>
      <div className="customer-history-summary">
        <div>
          <span>Orders placed</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Delivered</span>
          <strong>
            {
              orders.filter(
                (order) => order.shipmentStatus.code === 'delivered'
              ).length
            }
          </strong>
        </div>
        <div>
          <span>In transit</span>
          <strong>
            {
              orders.filter((order) => order.shipmentStatus.code === 'shipped')
                .length
            }
          </strong>
        </div>
      </div>
      <CustomerHistoryChart orders={orders}/>
      <Card title="Order History" className="customer-order-history">
        <CardHeader>
          <CardTitle>{_('Order History')}</CardTitle>
          <CardDescription>
            {_('Open an order to review payment, delivery or return details.')}
          </CardDescription>
        </CardHeader>
        <label className="customer-history-search">
          <Search size={16} />
          <input
            type="search"
            aria-label="Search customer orders"
            placeholder="Find an order number"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setVisible(6);
            }}
          />
        </label>
        {filtered.length < 1 && (
          <CardContent>
            <div>
              {_(
                orders.length
                  ? 'No orders match your search.'
                  : 'This customer has not placed an order yet.'
              )}
            </div>
          </CardContent>
        )}
        {orders.length > 0 && (
          <CardContent>
            {filtered.slice(0, visible).map((order) => (
              <a
                className="customer-history-order"
                href={order.editUrl}
                key={order.uuid}
              >
                <div className="customer-history-reference">
                  <strong>#{order.orderNumber}</strong>
                  <small>{order.createdAt.text}</small>
                </div>
                <div className="customer-history-status">
                  <span>
                    <span className="sr-only">Payment: </span>
                    {order.paymentStatus.name}
                  </span>
                  <span>
                    <span className="sr-only">Delivery: </span>
                    {order.shipmentStatus.name}
                  </span>
                </div>
                <strong className="customer-history-amount">
                  {order.grandTotal.text}
                </strong>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </CardContent>
        )}
        {filtered.length > visible && (
          <div className="customer-history-more">
            <span>
              Showing {Math.min(visible, filtered.length)} of {filtered.length}{' '}
              orders
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setVisible((count) => count + 6)}
            >
              Show more orders
            </button>
          </div>
        )}
      </Card>
    </>
  );
}

OrderHistory.propTypes = {
  customer: PropTypes.shape({
    orders: PropTypes.arrayOf(
      PropTypes.shape({
        orderNumber: PropTypes.string
      })
    )
  }).isRequired
};

export const layout = {
  areaId: 'leftSide',
  sortOrder: 10
};

export const query = `
  query Query {
    customer(id: getContextValue("customerUuid", null)) {
      orders {
        orderNumber
        uuid
        editUrl
        createdAt {
          value
          text
        }
        shipmentStatus {
          code
          name
        }
        paymentStatus {
          name
        }
        grandTotal {
          value
          text
        }
      }
    }
  }
`;
