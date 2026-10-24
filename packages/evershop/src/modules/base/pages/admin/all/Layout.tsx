import Area from '@components/common/Area.js';
import React from 'react';

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-navigation">
        <Area id="adminBrand" noOuter />
        <Area id="adminNavigation" noOuter />
        <Area id="adminAccount" noOuter />
      </aside>
      <div className="content-wrapper">
        <header className="header">
          <div className="mobile-admin-brand">
            <Area id="adminBrand" noOuter />
          </div>
          <Area id="header" noOuter />
          <div className="mobile-admin-account">
            <Area id="adminAccount" noOuter />
          </div>
        </header>
        <main className="main-content">
          <Area id="content" className="main-content-inner" />
          <div className="footer flex justify-between">
            <Area id="footerLeft" className="footer-left" />
            <Area id="footerRight" className="footer-right" />
          </div>
        </main>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'body',
  sortOrder: 10
};
