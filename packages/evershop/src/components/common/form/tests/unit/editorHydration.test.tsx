import '../../../../frontStore/customer/address/tests/unit/domSetup.js';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FormProvider, useForm } from 'react-hook-form';
import { createClient, Provider } from 'urql';
import { Editor } from '../../Editor.js';
import CancelButton from '../../../../../modules/oms/pages/admin/orderEdit/CancelButton.js';

const client = createClient({
  url: 'http://localhost/api/graphql',
  exchanges: []
});

function Editors() {
  const form = useForm();
  return (
    <Provider value={client}>
      <FormProvider {...form}>
        <Editor name="first" />
        <Editor
          name="second"
          value={[{ size: 1, columns: [{ size: 1, data: {} }] }] as any}
        />
      </FormProvider>
    </Provider>
  );
}

function holderIds(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html;
  return Array.from(
    container.querySelectorAll('.column > div[id]'),
    (holder) => holder.id
  );
}

describe('Commerce form hydration', () => {
  it('gives editor holders stable, distinct IDs across server and client renders', () => {
    const serverIds = holderIds(renderToString(<Editors />));
    const clientIds = holderIds(renderToString(<Editors />));
    expect(serverIds).toHaveLength(2);
    expect(new Set(serverIds).size).toBe(2);
    expect(clientIds).toEqual(serverIds);
  });

  it('renders one button for the order cancellation trigger', () => {
    const html = renderToString(
      <CancelButton
        order={{
          cancelApi: '/test-cancel',
          canCancel: true
        }}
      />
    );
    expect(html).toContain('Cancel Order');
    expect(html.match(/<button\b/g)).toHaveLength(1);
  });
  it('does not offer cancellation when the order policy disallows it', () => {
    const html = renderToString(
      <CancelButton order={{ cancelApi: '/test-cancel', canCancel: false }} />
    );
    expect(html).not.toContain('Cancel Order');
    expect(html).not.toContain('<button');
  });
});
