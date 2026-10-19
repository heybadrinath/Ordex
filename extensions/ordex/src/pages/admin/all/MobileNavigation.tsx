import React from 'react';
export default function MobileNavigation() {
  return (
    <nav className="mobile-studio-nav" aria-label="Seller navigation">
      <a href="/admin">Overview</a>
      <a href="/admin/orders">Orders</a>
      <a href="/admin/returns">Returns</a>
      <a href="/admin/products">Products</a>
    </nav>
  );
}
export const layout = { areaId: 'header', sortOrder: 15 };
