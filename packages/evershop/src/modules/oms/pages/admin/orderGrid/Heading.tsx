import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { WorkspaceSummary } from '@components/admin/WorkspaceSummary.js';
import { OrderInsights } from '@components/admin/WorkspaceInsights.js';

export default function OrderGridHeading({
  summaryUrl
}: {
  summaryUrl: string;
}) {
  return (
    <>
      <PageHeading
        heading="Orders"
        eyebrow="Order workspace"
        description="Review payments, prepare dispatches and follow each delivery."
        icon={<ShoppingBag size={24} />}
      />
      <WorkspaceSummary kind="orders" url={summaryUrl} />
      <OrderInsights url={summaryUrl} />
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
