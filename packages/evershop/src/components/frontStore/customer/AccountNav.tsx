import React from 'react';
import {
  ArrowUpRight,
  LayoutGrid,
  ShoppingBag,
  RotateCcw,
  PackageCheck
} from 'lucide-react';
import { useCustomer } from './CustomerContext.js';

export function AccountNav({
  active
}: {
  active: 'dashboard' | 'orders' | 'returns';
}) {
  const { customer } = useCustomer();
  const links = [
    { key: 'dashboard', href: '/account', label: 'Overview', Icon: LayoutGrid },
    {
      key: 'orders',
      href: '/account/orders',
      label: 'Your orders',
      Icon: ShoppingBag
    },
    {
      key: 'returns',
      href: '/account/returns',
      label: 'Returns & refunds',
      Icon: RotateCcw
    }
  ];
  return (
    <nav className="account-nav" aria-label="Your account">
      <div className="account-nav-profile">
        <span className="account-nav-avatar" aria-hidden="true">
          {customer?.fullName?.trim().charAt(0) || 'O'}
        </span>
        <strong>{customer?.fullName || 'Your account'}</strong>
        <span>{customer?.email}</span>
      </div>
      <div className="account-nav-links">
        {links.map(({ key, href, label, Icon }) => (
          <a
            key={key}
            href={href}
            aria-label={label}
            aria-current={active === key ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={1.7} />
            <span className="account-nav-label">{label}</span>
            <span className="account-nav-short">
              {key === 'dashboard'
                ? 'Overview'
                : key === 'orders'
                ? 'Orders'
                : 'Returns'}
            </span>
            <ArrowUpRight size={14} className="account-nav-arrow" />
          </a>
        ))}
      </div>
      <div className="account-nav-care">
        <PackageCheck size={26} strokeWidth={1.4} />
        <strong>A little care, after checkout.</strong>
        <p>Track a delivery or find your refund update, all right here.</p>
        <a href="/products">
          Find something lovely <ArrowUpRight size={14} />
        </a>
      </div>
    </nav>
  );
}
