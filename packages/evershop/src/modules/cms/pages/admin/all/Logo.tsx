// Modified for Ordex on 19 October 2026.
import React from 'react';
import { Package } from 'lucide-react';
export default function Logo({ dashboardUrl }: { dashboardUrl: string }) {
  return (
    <a
      href={dashboardUrl}
      className="ordex-admin-brand"
      aria-label="Ordex dashboard"
    >
      <span className="admin-brand-mark">
        <Package size={21} strokeWidth={1.7} />
      </span>
      <span className="admin-brand-label">
        <strong>Ordex</strong>
        <small>Seller workspace</small>
      </span>
    </a>
  );
}
export const layout = { areaId: 'adminBrand', sortOrder: 10 };
export const query = `query { dashboardUrl: url(routeId:"dashboard") }`;
