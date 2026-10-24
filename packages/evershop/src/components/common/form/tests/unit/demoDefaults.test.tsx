import '../../../../frontStore/customer/address/tests/unit/domSetup.js';
import { describe, expect, it } from '@jest/globals';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { InputField } from '../../InputField.js';
import { NumberField } from '../../NumberField.js';
import { DemoFormDefaults } from '../../DemoFormDefaults.js';
import { demoDefaults } from '../../demoDefaults.js';

describe('Editable demo defaults', () => {
  it('fills empty fields without replacing existing values or zero stock', async () => {
    let form: UseFormReturn;
    const host = document.createElement('div');
    const root = createRoot(host);
    function Fixture() {
      form = useForm<Record<string, any>>({
        defaultValues: { name: 'Existing name', qty: 0, sku: '' }
      });
      return (
        <FormProvider {...form}>
          <DemoFormDefaults profile="product" />
          <InputField name="name" />
          <InputField name="sku" />
          <NumberField name="qty" />
          <NumberField name="price" />
        </FormProvider>
      );
    }
    await act(async () => root.render(<Fixture />));
    expect(form!.getValues('name')).toBe('Existing name');
    expect(form!.getValues('qty')).toBe(0);
    expect(form!.getValues('sku')).toMatch(/^DEMO-CUP-/);
    expect(
      (host.querySelector('[name=sku]') as HTMLInputElement).value
    ).toMatch(/^DEMO-CUP-/);
    expect((host.querySelector('[name=price]') as HTMLInputElement).value).toBe(
      '790'
    );
    expect(form!.formState.isDirty).toBe(false);
    await act(async () => {
      form!.setValue('price', 1250, { shouldDirty: true });
    });
    await act(async () => root.render(<Fixture />));
    expect(form!.getValues('price')).toBe(1250);
    await act(async () => root.unmount());
  });
  it('keeps the generated identity distinct for each new record', () => {
    expect(demoDefaults('product', 'one').sku).not.toBe(
      demoDefaults('product', 'two').sku
    );
    expect(demoDefaults('registration', 'one').email).toBe(
      'alex.one@ordex.example'
    );
    expect(demoDefaults('category', 'one').url_key).toMatch(/^[a-z0-9-]+$/);
    expect(demoDefaults('attribute', 'one').attribute_code).toMatch(
      /^[a-z0-9_]+$/
    );
  });
});
