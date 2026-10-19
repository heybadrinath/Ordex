// Modified for Ordex on 19 October 2026.
import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

export default function DashboardPageHeading() {
  return <PageHeading heading={_('Your store, at a glance.')} />;
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};
