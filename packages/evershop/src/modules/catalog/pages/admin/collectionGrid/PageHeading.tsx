import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { CollectionInsights } from '@components/admin/CatalogInsights.js';
import { Layers3 } from 'lucide-react';

export default function CollectionGridPageHeading({
  summaryUrl
}: {
  summaryUrl: string;
}) {
  return (
    <div className="w-full" style={{ margin: '0 auto' }}>
      <PageHeading
        heading="Collections"
        eyebrow="Merchandising"
        description="Bring products together for the moments your customers shop for."
        icon={<Layers3 size={24} />}
      />
      <CollectionInsights url={summaryUrl} />
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
