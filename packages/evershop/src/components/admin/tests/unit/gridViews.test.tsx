import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GridViews } from '../../GridViews.js';

describe('Grid views', () => {
  it('preserves search and sorting, resets pagination and marks the selected filter', () => {
    const html = renderToStaticMarkup(
      <GridViews
        baseUrl="/admin/products"
        filterKey="status"
        unit="Products"
        total={7}
        views={[{ label: 'All products' }, { label: 'Active', value: '1' }]}
        currentFilters={[
          { key: 'keyword', value: 'desk & lamp' },
          { key: 'sort_by', value: 'name' },
          { key: 'page', value: '3' },
          { key: 'status', value: '1' }
        ]}
      />
    );
    expect(html).toContain(
      'href="/admin/products?keyword=desk+%26+lamp&amp;sort_by=name"'
    );
    expect(html).toContain('status=1" aria-current="page">Active');
    expect(html).not.toContain('page=3');
    expect(html).toContain('7 products');
  });
  it('shows the selection count without changing the filtered result total', () => {
    const html = renderToStaticMarkup(
      <GridViews
        baseUrl="/admin/orders"
        filterKey="shipment_status"
        unit="Orders"
        total={42}
        selected={2}
        views={[{ label: 'All orders' }]}
        currentFilters={[]}
      />
    );
    expect(html).toContain('aria-current="page">All orders');
    expect(html).toContain('2 selected');
  });
});
