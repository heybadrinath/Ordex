// Modified for Ordex on 19 October 2026.
import OrderHistory from '@components/frontStore/customer/OrderHistory.js';
import React from 'react';
export default function CustomerOrders() {
  return (
    <section className="customer-orders-panel">
      <OrderHistory showFilters />
    </section>
  );
}
export const layout = { areaId: 'accountPageContent', sortOrder: 10 };
