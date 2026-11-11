// Modified for Ordex on 20 October 2026.
import { SettingMenuItem } from '@components/admin/SettingMenuItem.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface StoreSettingMenuProps {
  storeSettingUrl: string;
}

export default function StoreSettingMenu({
  storeSettingUrl
}: StoreSettingMenuProps) {
  return (
    <SettingMenuItem
      url={storeSettingUrl}
      title={_('Store details')}
      description={_('Identity, contact and location')}
    />
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 5
};

export const query = `
  query Query {
    storeSettingUrl: url(routeId: "storeSetting")
  }
`;
