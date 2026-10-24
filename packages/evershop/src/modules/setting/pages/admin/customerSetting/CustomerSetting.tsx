// Modified for Ordex on 20 October 2026.
import { SettingsLayout } from '@components/admin/SettingsLayout.js';
import { CustomerFormPreview } from '@components/admin/SettingsPreviews.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { Card } from '@components/common/ui/Card.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { useForm } from 'react-hook-form';
import {
  AddressSection,
  type CountryOption,
  type CustomerAddressSettingValues
} from './components/AddressSection.js';

/**
 * Settings → Customer: what your customers are asked for. One form, one card,
 * sections registered into Area `customerSettingSections` — Addresses is the
 * first; a module adds another section with `layout = { areaId:
 * 'customerSettingSections', sortOrder }` on the `customerSetting` route and
 * its fields post with the same Save button (the generic `saveSetting` upsert
 * takes any setting rows).
 */
interface CustomerSettingProps {
  saveSettingApi: string;
  countries: CountryOption[];
  setting: CustomerAddressSettingValues;
}

export default function CustomerSetting({
  saveSettingApi,
  countries,
  setting
}: CustomerSettingProps) {
  const form = useForm({ shouldUnregister: true, shouldFocusError: false });
  return (
    <SettingsLayout
      title={_('Customer settings')}
      description={_(
        'Choose what customers enter in their address book and at checkout.'
      )}
      formId="customerSetting"
      preview={<CustomerFormPreview control={form.control} initial={setting}/>}
      saving={form.formState.isSubmitting}
    >
      <Form
        form={form}
        method="POST"
        id="customerSetting"
        action={saveSettingApi}
        submitBtn={false}
      >
        <Card>
          <Area
            id="customerSettingSections"
            noOuter
            coreComponents={[
              {
                id: 'addresses',
                component: { default: AddressSection },
                props: { setting, countries },
                sortOrder: 10
              }
            ]}
          />
        </Card>
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
    countries(scope: ALL) {
      code
      name
    }
    setting {
      addressNameFormat
      addressTelephone
      addressOrganization
      addressLine2
      addressLine3
      addressRequired
      addressDefaultCountry
    }
  }
`;
