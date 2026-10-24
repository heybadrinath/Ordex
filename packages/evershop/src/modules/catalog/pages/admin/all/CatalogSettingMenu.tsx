// Modified for Ordex on 20 October 2026.
import { SettingMenuItem } from '@components/admin/SettingMenuItem.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface CatalogSettingMenuProps {
  catalogSettingUrl: string;
}

export default function CatalogSettingMenu({
  catalogSettingUrl
}: CatalogSettingMenuProps) {
  return (
    <SettingMenuItem
      url={catalogSettingUrl}
      title={_('Catalog')}
      description={_('Listings, images and recommendations')}
    />
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 7
};

export const query = `
  query Query {
    catalogSettingUrl: url(routeId: "catalogSetting")
  }
`;
