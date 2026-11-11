import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { AttributeInsights } from '@components/admin/CatalogInsights.js';
import { SlidersHorizontal } from 'lucide-react';

export interface AttributGridPageHeadingProps {
  backUrl?: string;
}
export default function AttributGridPageHeading({
  summaryUrl
}: {
  summaryUrl: string;
}) {
  return (
    <>
      <PageHeading
        heading="Attributes"
        eyebrow="Catalog"
        description="Keep product details and shopping filters consistent."
        icon={<SlidersHorizontal size={24} />}
      />
      <AttributeInsights url={summaryUrl} />
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
