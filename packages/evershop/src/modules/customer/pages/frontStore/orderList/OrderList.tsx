import Area from '@components/common/Area.js';
import React from 'react';

/**
 * Customer order list shell. Same frame as the account dashboard (a centered
 * `max-w-2xl` column); the header and nav blocks are shared with it through
 * the `account+orderList` folder, the list is this route's own block:
 *
 *   account+orderList/AccountHeader  → accountPageHeader  10
 *   account+orderList/AccountNav     → accountPageHeader  20
 *   orderList/CustomerOrders         → accountPageContent 10
 */
export default function OrderList() {
  return (
    <div className="account customer-account-shell">
      <Area id="accountPageHeader" noOuter />
      <div className="account-content">
        <Area id="accountPageContent" noOuter />
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
