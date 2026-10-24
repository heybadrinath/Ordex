import React from 'react';
import { useCustomer } from '@components/frontStore/customer/CustomerContext.js';
import { ShoppingBag, Truck, MapPin } from 'lucide-react';
export default function AccountSummary() {
  const { customer } = useCustomer();
  const orders = customer?.orders || [];
  const onTheWay = orders.filter((order) =>
    ['shipping', 'shipped', 'in_transit', 'partially_delivered'].includes(
      order.shipmentStatus?.code || ''
    )
  ).length;
  return (
    <div className="account-summary-grid">
      {[
        {
          Icon: ShoppingBag,
          label: 'Total orders',
          value: orders.length,
          href: '/account/orders'
        },
        {
          Icon: Truck,
          label: 'On the way',
          value: onTheWay,
          href: '/account/orders'
        },
        {
          Icon: MapPin,
          label: 'Saved addresses',
          value: customer?.addresses?.length || 0,
          href: '#account-addresses'
        }
      ].map(({ Icon, label, value, href }) => (
        <a className="account-summary-card" key={label} href={href}>
          <div>
            <span>{label}</span>
            <Icon size={17} />
          </div>
          <strong>{value}</strong>
        </a>
      ))}
    </div>
  );
}
export const layout = { areaId: 'accountPageContent', sortOrder: 0 };
