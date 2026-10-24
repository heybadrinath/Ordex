// Modified for Ordex on 20 October 2026.
import Area from '@components/common/Area.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

export function SettingMenu() {
  return (
    <nav aria-label={_('Settings')} className="setting-page-menu">
      <div className="settings-nav-heading">{_('PREFERENCES')}</div>
      <Area id="settingPageMenu" noOuter coreComponents={[]} />
    </nav>
  );
}
