// Modified for Ordex on 20 October 2026.
import { SettingMenuItem } from '@components/admin/SettingMenuItem.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface TaxSettingMenuProps {
  taxSettingUrl: string;
}

export default function TaxSettingMenu({ taxSettingUrl }: TaxSettingMenuProps) {
  return (
    <SettingMenuItem
      url={taxSettingUrl}
      title={_('Pricing & tax')}
      description={_('Rounding, classes and tax rates')}
    />
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 20
};

export const query = `
  query Query {
    taxSettingUrl: url(routeId: "taxSetting")
  }
`;
