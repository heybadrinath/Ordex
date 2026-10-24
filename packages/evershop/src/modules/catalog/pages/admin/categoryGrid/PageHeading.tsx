import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { CategoryInsights } from '@components/admin/CatalogInsights.js';
import { FolderTree } from 'lucide-react';

export default function CategoryGridPageHeading({
  summaryUrl
}: {
  summaryUrl: string;
}) {
  return (
    <>
      <PageHeading
        heading="Categories"
        eyebrow="Catalog"
        description="Give every product a place that is easy to find."
        icon={<FolderTree size={24} />}
      />
      <CategoryInsights url={summaryUrl} />
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
