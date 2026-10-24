// Modified for Ordex on 20 October 2026.
import { SettingMenuItem } from '@components/admin/SettingMenuItem.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface CustomerSettingMenuProps {
  customerSettingUrl: string;
}

export default function CustomerSettingMenu({
  customerSettingUrl
}: CustomerSettingMenuProps) {
  return (
    <SettingMenuItem
      url={customerSettingUrl}
      title={_('Customer forms')}
      description={_('Address fields and checkout')}
    />
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 6
};

export const query = `
  query Query {
    customerSettingUrl: url(routeId: "customerSetting")
  }
`;
