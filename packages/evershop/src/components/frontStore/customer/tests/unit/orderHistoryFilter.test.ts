import { describe, expect, it } from '@jest/globals';
import { filterCustomerOrders } from '../../OrderHistory.js';
import type { Order } from '../../CustomerContext.js';

const orders = [
  {
    orderId: 1,
    orderNumber: '10001',
    createdAt: { value: '2026-10-20T12:00:00Z' },
    shipmentStatus: { code: 'delivered' },
    items: [{ productName: 'Ceramic cup' }]
  },
  {
    orderId: 2,
    orderNumber: '10002',
    createdAt: { value: '2026-10-22T12:00:00Z' },
    shipmentStatus: { code: 'shipped' },
    items: [{ productName: 'Desk lamp' }]
  },
  {
    orderId: 3,
    orderNumber: '10003',
    createdAt: { value: '2026-10-23T12:00:00Z' },
    shipmentStatus: { code: 'pending' },
    items: [{ productName: 'Linen cushion' }]
  }
] as unknown as Order[];

describe('Customer order views', () => {
  it('combines delivery and case-insensitive item or reference filters', () => {
    expect(
      filterCustomerOrders(orders, 'on_the_way', ' LAMP ').map(
        (order) => order.orderNumber
      )
    ).toEqual(['10002']);
    expect(filterCustomerOrders(orders, 'delivered', '10001')).toHaveLength(1);
    expect(filterCustomerOrders(orders, 'delivered', 'lamp')).toHaveLength(0);
  });
  it('sorts recent orders first without modifying customer records', () => {
    expect(
      filterCustomerOrders(orders, 'all', '').map((order) => order.orderId)
    ).toEqual([3, 2, 1]);
    expect(orders.map((order) => order.orderId)).toEqual([1, 2, 3]);
  });
  it('sorts native timestamp strings independently of order identifiers', () => {
    const nativeOrders = [
      { ...orders[0], orderId: 10, createdAt: { value: '1791892800000' } },
      { ...orders[1], orderId: 8, createdAt: { value: '1792324800000' } },
      { ...orders[2], orderId: 9, createdAt: { value: '1792065600000' } }
    ] as Order[];
    expect(
      filterCustomerOrders(nativeOrders, 'all', '').map(
        (order) => order.orderId
      )
    ).toEqual([8, 9, 10]);
  });
});
