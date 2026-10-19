// Modified for Ordex on 19 October 2026.
import React from 'react';
export default function Logo({ dashboardUrl }: { dashboardUrl: string }) {
  return (
    <a
      href={dashboardUrl}
      className="ordex-admin-brand"
      aria-label="Ordex dashboard"
    >
      <span>✳</span> ordex <small>STUDIO</small>
    </a>
  );
}
export const layout = { areaId: 'header', sortOrder: 10 };
export const query = `query { dashboardUrl: url(routeId:"dashboard") }`;
