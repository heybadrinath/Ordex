import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryNameRow } from '../../pages/admin/categoryGrid/rows/CategoryName.js';
import { CollectionPreview } from '../../pages/admin/collectionGrid/rows/CollectionPreview.js';

describe('admin catalog rows with incomplete optional data', () => {
  it('keeps the category link usable when the hierarchy is unavailable', () => {
    const html = renderToStaticMarkup(
      <CategoryNameRow
        category={{
          name: 'Lighting',
          editUrl: '/admin/categories/edit/lighting',
          path: null
        }}
      />
    );
    expect(html).toContain('href="/admin/categories/edit/lighting"');
    expect(html).toContain('Lighting');
  });

  it('shows a preview placeholder for a null product list', () => {
    const html = renderToStaticMarkup(<CollectionPreview products={null} />);
    expect(html).toContain('No product images');
    expect(html).not.toContain('<img');
  });

  it('skips missing images while retaining the available product photography', () => {
    const html = renderToStaticMarkup(
      <CollectionPreview
        products={[
          null,
          { image: null },
          { image: { url: '/media/lamp.jpg' } }
        ]}
      />
    );
    expect(html).toContain('src="/media/lamp.jpg"');
    expect(html.match(/<img /g)).toHaveLength(1);
  });
});
