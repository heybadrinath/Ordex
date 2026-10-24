// Modified for Ordex on 20 October 2026.
import { SettingsLayout } from '@components/admin/SettingsLayout.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface ShippingProvidersProps {
  saveSettingApi: string;
}

/**
 * Shipping Providers settings page — same structure as the Payment settings
 * page (`setting/pages/admin/paymentSetting/PaymentSetting.tsx`): one
 * section per provider, each provider owns its section as a React component
 * mounted into the `shippingProviderSetting` area (Core ships its methods
 * section; extensions like Shippo/ShipStation ship their credentials
 * sections). The surrounding form posts every registered field to the
 * saveSetting API.
 */
export default function ShippingProviders({
  saveSettingApi
}: ShippingProvidersProps) {
  return (
    <SettingsLayout
      title={_('Shipping methods')}
      description={_(
        'Manage your delivery services and their rates. Methods save individually.'
      )}
    >
      <Form
        submitBtn={false}
        id="shippingProviderSettingForm"
        method="POST"
        action={saveSettingApi}
        successMessage={_('Shipping provider setting saved')}
      >
        <Area id="shippingProviderSetting" className="grid gap-5" />
      </Form>
    </SettingsLayout>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
  }
`;
