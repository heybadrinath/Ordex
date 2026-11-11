import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { Users } from 'lucide-react';
import { WorkspaceSummary } from '@components/admin/WorkspaceSummary.js';
import { CustomerInsights } from '@components/admin/CustomerInsights.js';

export default function CustomerGridHeading({
  summaryUrl
}: {
  summaryUrl: string;
}) {
  return (
    <>
      <PageHeading
        heading="Customers"
        eyebrow="Customer directory"
        description="Find a customer, review their orders and manage their account."
        icon={<Users size={24} />}
      />
      <WorkspaceSummary kind="customers" url={summaryUrl} />
      <CustomerInsights url={summaryUrl} />
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
export const query = `query { summaryUrl: url(routeId:"studioSummary") }`;
