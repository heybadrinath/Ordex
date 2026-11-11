// Modified for Ordex on 19 October 2026.
import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';
import { Package } from 'lucide-react';
import { WorkspaceSummary } from '@components/admin/WorkspaceSummary.js';
import { ProductInsights } from '@components/admin/WorkspaceInsights.js';
export default function ProductGridPageHeading({
  summaryUrl
}: {
  summaryUrl: string;
}) {
  return (
    <>
      <PageHeading
        heading="Products"
        eyebrow="Catalog"
        description="Manage your assortment, availability and stock in one place."
        icon={<Package size={24} />}
      />
      <WorkspaceSummary kind="products" url={summaryUrl} />
      <ProductInsights url={summaryUrl} />
    </>
  );
}
export const layout = { areaId: 'content', sortOrder: 10 };
export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
