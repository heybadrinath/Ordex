import '../../../frontStore/customer/address/tests/unit/domSetup.js';
import { afterEach, expect, it } from '@jest/globals';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Form } from '../../form/Form.js';
import { Image } from '../../Image.js';
import { LoadingBar } from '../../LoadingBar.js';

const originalFetch = globalThis.fetch;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await act(async () => root.unmount());
  root = createRoot(container);
});

it('blocks a repeated form submission while pending and releases it after an API error', async () => {
  let resolve!: (response: Response) => void;
  let calls = 0;
  let errorMessage = '';
  globalThis.fetch = () => {
    calls++;
    return new Promise<Response>((done) => {
      resolve = done;
    });
  };
  await act(async () =>
    root.render(
      <Form
        action="/save"
        onError={(error) => {
          errorMessage = error;
        }}
      >
        <input name="note" />
      </Form>
    )
  );
  const form = container.querySelector('form')!;
  await act(async () => {
    form.dispatchEvent(
      new window.Event('submit', { bubbles: true, cancelable: true })
    );
  });
  expect(container.querySelector('button')?.getAttribute('aria-busy')).toBe(
    'true'
  );
  expect(container.querySelector('fieldset')?.disabled).toBe(true);
  await act(async () => {
    form.dispatchEvent(
      new window.Event('submit', { bubbles: true, cancelable: true })
    );
  });
  expect(calls).toBe(1);
  await act(async () => {
    resolve(new Response(JSON.stringify({ error: { message: 'Try again' } })));
  });
  expect(errorMessage).toBe('Try again');
  expect(container.querySelector('button')?.disabled).toBe(false);
  expect(container.querySelector('fieldset')?.disabled).toBe(false);
});

it('keeps direct image URLs and clears placeholders on failure or successful retry', async () => {
  await act(async () =>
    root.render(
      <Image
        unoptimized
        src="/photo-a.jpg"
        alt="Product"
        width={80}
        height={80}
      />
    )
  );
  let img = container.querySelector('img')!;
  expect(img.getAttribute('src')).toBe('/photo-a.jpg');
  expect(img.hasAttribute('srcset')).toBe(false);
  expect(img.dataset.imageState).toBe('loading');
  await act(async () => img.dispatchEvent(new window.Event('error')));
  expect(img.dataset.imageState).toBe('ready');
  await act(async () =>
    root.render(
      <Image
        unoptimized
        src="/photo-b.jpg"
        alt="Product"
        width={80}
        height={80}
      />
    )
  );
  img = container.querySelector('img')!;
  expect(img.dataset.imageState).toBe('loading');
  await act(async () => img.dispatchEvent(new window.Event('load')));
  expect(img.dataset.imageState).toBe('ready');
});

it('shows navigation feedback only for same-tab page links and clears it on return', async () => {
  globalThis.HTMLAnchorElement = window.HTMLAnchorElement;
  await act(async () => root.render(<LoadingBar />));
  const link = document.createElement('a');
  link.href = '/orders';
  container.append(link);
  const stopNavigation = (event: Event) => event.preventDefault();
  document.addEventListener('click', stopNavigation);
  try {
    await act(async () => {
      link.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true
        })
      );
    });
    expect(container.textContent).not.toContain('Opening page');
    await act(async () => {
      link.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, cancelable: true })
      );
    });
    expect(container.textContent).toContain('Opening page');
    await act(async () => {
      window.dispatchEvent(new window.Event('pageshow'));
    });
    expect(container.textContent).not.toContain('Opening page');
  } finally {
    document.removeEventListener('click', stopNavigation);
  }
});
