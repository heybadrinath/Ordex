// Modified for Ordex on 20 October 2026.
import { SettingMenuItem } from '@components/admin/SettingMenuItem.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface ShippingProvidersMenuProps {
  shippingProvidersUrl: string;
}

/**
 * Settings → Shipping Providers menu entry. Lives alongside the legacy
 * ShippingSettingMenu in `settingPageMenu` during phase 6. Phase 7 rebuilds
 * the zone admin behind the same URL; phase 8 removes the legacy entry.
 */
export default function ShippingProvidersMenu({
  shippingProvidersUrl
}: ShippingProvidersMenuProps) {
  return (
    <SettingMenuItem
      url={shippingProvidersUrl}
      title={_('Shipping methods')}
      description={_('Services and delivery rates')}
    />
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 16
};

export const query = `
  query Query {
    shippingProvidersUrl: url(routeId: "shippingProviders")
  }
`;
