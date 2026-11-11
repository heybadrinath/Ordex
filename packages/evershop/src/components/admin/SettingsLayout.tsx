import { SettingMenu } from '@components/admin/SettingMenu.js';
import { Button } from '@components/common/ui/Button.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ChevronRight, Save, SlidersHorizontal } from 'lucide-react';
import React from 'react';

interface SettingsLayoutProps {
  title: string;
  description: string;
  formId?: string;
  saving?: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export function SettingsLayout({
  title,
  description,
  formId,
  saving = false,
  children,
  preview
}: SettingsLayoutProps) {
  return (
    <div className="settings-page">
      <div className="settings-breadcrumb">
        <a href="/admin">{_('Workspace')}</a>
        <ChevronRight size={12} aria-hidden="true" />
        <span>{_('Settings')}</span>
      </div>
      <header className="settings-heading">
        <div className="settings-heading-copy">
          <span className="settings-heading-icon">
            <SlidersHorizontal size={21} aria-hidden="true" />
          </span>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>
        {formId && (
          <Button
            type="submit"
            form={formId}
            isLoading={saving}
            className="settings-save-button"
          >
            <Save size={15} aria-hidden="true" />
            {_('Save changes')}
          </Button>
        )}
      </header>
      <div className="settings-layout">
        <aside className="settings-rail">
          <SettingMenu />
        </aside>
        <div className="settings-content">
          {preview}
          {children}
        </div>
      </div>
    </div>
  );
}
